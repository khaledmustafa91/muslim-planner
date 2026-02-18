import { useState, useMemo, useEffect } from "react";
import { Modal } from "./ui/modal";
import { ConfirmModal } from "./ui/confirm-modal";
import { ScheduleForm, ScheduleData } from "./schedule-form";
import { RamadanDay } from "@/lib/date-utils";
import { PlannerSection } from "@/lib/types";

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  planId: string;
  sections: PlannerSection[];
  ramadanDays: RamadanDay[];
  onSuccess: () => void;
  initialSectionId?: string;
}

export function CreateTaskModal({
  isOpen,
  onClose,
  planId,
  sections,
  ramadanDays,
  onSuccess,
  initialSectionId,
}: CreateTaskModalProps) {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showConfirmClose, setShowConfirmClose] = useState(false);

    // Form State
    const [taskName, setTaskName] = useState("");
    const [selectedSectionId, setSelectedSectionId] = useState("");
    const [newCategoryName, setNewCategoryName] = useState("");
    const [isNewCategory, setIsNewCategory] = useState(false);

  // Handle initialSectionId prop
  useEffect(() => {
    if (isOpen) {
      if (initialSectionId) {
        setSelectedSectionId(initialSectionId);
        setIsNewCategory(false);
      } else {
        // Only reset if not explicitly provided
        setSelectedSectionId("");
        setIsNewCategory(false);
      }
    }
  }, [isOpen, initialSectionId]);

  const resetForm = () => {
    setStep(1);
    setTaskName("");
    setSelectedSectionId(initialSectionId || "");
    setNewCategoryName("");
    setIsNewCategory(false);
    setSchedule({ type: "one-time", time: "12:00" });
    setError(null);
  };

  const handleClose = () => {
    const isModalDirty = taskName || (!initialSectionId && selectedSectionId) || newCategoryName;
    if (isModalDirty) {
      if (confirm("هل تريد الإلغاء؟ سيتم فقدان ما أدخلته.")) {
        resetForm();
        onClose();
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError(null);

        try {
            let sectionId = selectedSectionId;

            // 1. Create New Category if needed
            if (isNewCategory) {
                const sectionRes = await fetch("/api/sections", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ planId, title: newCategoryName }),
                });
                const sectionData = await sectionRes.json();
                if (!sectionRes.ok) throw new Error(sectionData.error || "فشل إنشاء القسم");
                sectionId = sectionData.section.id;
            }

            // 2. Create Task
            const taskRes = await fetch("/api/tasks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sectionId, title: taskName, type: "regular" }),
            });
            const taskData = await taskRes.json();
            if (!taskRes.ok) throw new Error(taskData.error || "فشل إنشاء المهمة");

  const isStep1Valid = useMemo(() => {
     const isNameValid = taskName.trim().length > 0;
     const isCategoryValid = isNewCategory ? newCategoryName.trim().length > 0 : selectedSectionId.length > 0;
     return isNameValid && isCategoryValid;
  }, [taskName, isNewCategory, newCategoryName, selectedSectionId]);

  const categoryTitle = useMemo(() => {
    return sections.find(s => s.id === selectedSectionId)?.title || "";
  }, [sections, selectedSectionId]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="مهمة جديدة"
    >
      <div className="space-y-8">
        {/* Steps Indicator */}
        <div className="flex items-center justify-between mb-8 relative px-4 text-right dir-rtl">
            <div className="absolute left-4 right-4 top-1/2 h-0.5 bg-slate-100 dark:bg-slate-800 -z-10" />
            {[1, 2, 3].map((s) => (
                <div 
                    key={s}
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all border-4 ${
                        step >= s 
                        ? "bg-emerald-600 border-white dark:border-slate-900 text-white shadow-lg" 
                        : "bg-slate-100 dark:bg-slate-800 border-white dark:border-slate-900 text-slate-400"
                    }`}
                >
                    {s}
                </div>
            ))}
        </div>

        {/* Step 1: Task Name + Category */}
        {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
                <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 text-right">
                        اسم المهمة
                    </label>
                    <input
                        autoFocus
                        type="text"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-right text-lg"
                        placeholder="مثال: قراءة جزء..."
                        value={taskName}
                        onChange={(e) => setTaskName(e.target.value)}
                    />
                </div>

                <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 text-right">
                        القسم (التصنيف)
                    </label>
                    
                    {!initialSectionId && (
                        <div className="flex gap-4 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                            <button 
                                onClick={() => setIsNewCategory(false)}
                                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${!isNewCategory ? 'bg-white dark:bg-slate-700 shadow text-emerald-700 dark:text-emerald-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                            >
                                قسم موجود
                            </button>
                            <button 
                                onClick={() => setIsNewCategory(true)}
                                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${isNewCategory ? 'bg-white dark:bg-slate-700 shadow text-emerald-700 dark:text-emerald-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                            >
                                قسم جديد
                            </button>
                        </div>
                    )}

                    {initialSectionId ? (
                        <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none transition-all text-right flex items-center justify-between">
                            <span className="text-emerald-600 dark:text-emerald-400">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                            </span>
                             <span className="font-bold text-slate-900 dark:text-slate-100">{categoryTitle}</span>
                        </div>
                    ) : (
                        !isNewCategory ? (
                            sections.length > 0 ? (
                                <div className="relative">
                                    <select
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-emerald-500 transition-all text-right dir-rtl appearance-none"
                                        value={selectedSectionId}
                                        onChange={(e) => setSelectedSectionId(e.target.value)}
                                    >
                                        <option value="">-- اختر القسم --</option>
                                        {sections.map((s) => (
                                            <option key={s.id} value={s.id}>
                                                {s.title}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center p-6 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-900/40">
                                    <p className="text-amber-800 dark:text-amber-200 text-sm font-medium mb-2">لا توجد أقسام حالية</p>
                                    <button 
                                        onClick={() => setIsNewCategory(true)}
                                        className="text-amber-600 dark:text-amber-400 text-xs font-bold underline hover:text-amber-700"
                                    >
                                        إنشاء قسم جديد
                                    </button>
                                </div>
                            )
                        ) : (
                            <input
                                type="text"
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-right"
                                placeholder="اسم القسم الجديد..."
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                            />
                        )
                    )}
                </div>
            </div>
        )}

        {/* Step 2: Schedule (Type + Details) */}
        {step === 2 && (
             <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
                <ScheduleForm 
                    value={schedule}
                    onChange={setSchedule}
                    ramadanDays={ramadanDays}
                    allowMultipleTimes={schedule.type === "recurring"}
                />
            </div>
        )}

        {/* Step 3: Summary */}
        {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300 text-right">
                <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl space-y-4 border border-slate-100 dark:border-slate-700 shadow-sm">
                    <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-3">
                        <span className="font-bold text-lg text-slate-900 dark:text-slate-100">{taskName}</span>
                        <span className="text-xs font-medium text-slate-500 bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded-lg">المهمة</span>
                    </div>
                    
                    <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-3">
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                            {isNewCategory ? newCategoryName : (initialSectionId ? categoryTitle : sections.find(s => s.id === selectedSectionId)?.title)}
                        </span>
                        <span className="text-xs font-medium text-slate-500">القسم</span>
                    </div>
                    
                    <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-3">
                        <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${schedule.type === "one-time" ? "bg-amber-400" : "bg-emerald-500"}`} />
                            <span className="font-bold text-slate-700 dark:text-slate-300 dir-rtl">
                                {schedule.type === "one-time" ? "مرة واحدة" : (schedule.recurrenceType === "daily" ? "يومياً" : "أسبوعياً")}
                            </span>
                        </div>
                        <span className="text-xs font-medium text-slate-500">التكرار</span>
                    </div>
                    
                     <div className="flex justify-between items-start pt-1">
                         <div className="flex flex-col items-end gap-1">
                            {(schedule.times && schedule.type === "recurring") ? schedule.times.map((t, i) => (
                                <span key={i} className="font-mono font-bold text-slate-900 dark:text-slate-100 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded text-sm">{t}</span>
                            )) : (
                                <span className="font-mono font-bold text-slate-900 dark:text-slate-100 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded text-sm">{schedule.time}</span>
                            )}
                         </div>
                        <span className="text-xs font-medium text-slate-500 mt-1">التوقيت</span>
                    </div>

                    {schedule.type === "one-time" && schedule.dayNumber && (
                        <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700">
                            <span className="font-medium text-slate-700 dark:text-slate-300 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1 rounded-lg text-sm text-emerald-700 dark:text-emerald-400">
                                {schedule.dayNumber} رمضان
                            </span>
                            <span className="text-xs font-medium text-slate-500">التاريخ</span>
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            {step < 3 ? (
                <button
                    onClick={() => setStep(s => s + 1)}
                    disabled={step === 1 && !isStep1Valid}
                    className="flex-1 bg-emerald-600 text-white py-3.5 rounded-xl font-bold hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                >
                    التالي
                </button>
            ) : (
                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex-1 bg-emerald-600 text-white py-3.5 rounded-xl font-bold hover:bg-emerald-700 transition-all disabled:opacity-50 shadow-sm hover:shadow-md"
                >
                    {loading ? "جاري الإنشاء..." : "تأكيد وإنشاء"}
                </button>
            )}
            
            {step > 1 ? (
                <button
                    onClick={() => setStep(s => s - 1)}
                    disabled={loading}
                    className="px-6 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 py-3.5 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-transparent hover:border-slate-300 dark:hover:border-slate-600"
                >
                    السابق
                </button>
            ) : (
                <button
                    onClick={handleClose}
                    className="px-6 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 py-3.5 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-transparent hover:border-slate-300 dark:hover:border-slate-600"
                >
                    إلغاء
                </button>
            )}
        </div>
        
        {error && (
            <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-xl border border-red-100 dark:border-red-900/40">
                <p className="text-red-600 dark:text-red-400 text-sm text-center font-bold flex items-center justify-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
                    {error}
                </p>
            </div>
        )}
      </div>
    </Modal>
  );
}
