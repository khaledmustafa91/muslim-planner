"use client";

import { Modal } from "./modal";

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "danger" | "default";
    loading?: boolean;
}

export function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = "تأكيد",
    cancelText = "إلغاء",
    variant = "default",
    loading = false,
}: ConfirmModalProps) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="space-y-4">
                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                    {description}
                </p>

                <div className="flex gap-3 pt-2">
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className={`flex-1 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50 ${variant === "danger"
                                ? "bg-red-600 text-white hover:bg-red-700"
                                : "bg-emerald-600 text-white hover:bg-emerald-700"
                            }`}
                    >
                        {loading ? "جاري المعالجة..." : confirmText}
                    </button>

                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 py-2.5 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                        {cancelText}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
