"use client";

import { useState } from "react";
import { Modal } from "./ui/modal";
interface CreateCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  planId: string;
  onSuccess: () => void;
}

export function CreateCategoryModal({
  isOpen,
  onClose,
  planId,
  onSuccess,
}: CreateCategoryModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [categoryName, setCategoryName] = useState("");

  const resetForm = () => {
    setCategoryName("");
    setError(null);
  };

  const handleClose = () => {
    if (categoryName.trim()) {
      if (confirm("هل تريد الإلغاء؟ سيتم فقدان ما أدخلته.")) {
        resetForm();
        onClose();
      }
    } else {
      resetForm();
      onClose();
    }
  };

  const handleSubmit = async () => {
    if (!categoryName.trim()) return;
    
    setLoading(true);
    setError(null);

    try {
      // Create Section
      const sectionRes = await fetch("/api/sections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, title: categoryName }),
      });
      const sectionData = await sectionRes.json();
      if (!sectionRes.ok) throw new Error(sectionData.error || "فشل إنشاء القسم");

      onSuccess();
      resetForm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="إنشاء قسم جديد"
    >
      <div className="space-y-8 py-2">
        <div className="space-y-3 animate-in fade-in slide-in-from-top-4 duration-300">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 text-right">
                اسم القسم
            </label>
            <input
                autoFocus
                type="text"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-right text-lg font-medium"
                placeholder="مثال: القرآن، الأذكار..."
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
            <p className="text-[10px] text-slate-400 text-right pr-1">
                سيتم إنشاء القسم فارغاً، ويمكنك إضافة مهام إليه لاحقاً.
            </p>
        </div>

        {error && (
            <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-xl border border-red-100 dark:border-red-900/40">
                <p className="text-red-600 dark:text-red-400 text-xs text-center font-bold">{error}</p>
            </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
                onClick={handleSubmit}
                disabled={loading || !categoryName.trim()}
                className="flex-[2] bg-emerald-600 text-white py-3.5 rounded-xl font-bold hover:bg-emerald-700 transition-all disabled:opacity-50 shadow-sm hover:shadow-md"
            >
                {loading ? "جاري الإنشاء..." : "تأكيد وإنشاء"}
            </button>
            <button
                onClick={handleClose}
                disabled={loading}
                className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 py-3.5 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-transparent hover:border-slate-300 dark:hover:border-slate-600"
            >
                إلغاء
            </button>
        </div>
      </div>
    </Modal>
  );
}

