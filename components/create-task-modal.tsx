"use client";

import { useState, useMemo } from "react";
import { Modal } from "./ui/modal";
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
}

export function CreateTaskModal({
  isOpen,
  onClose,
  planId,
  sections,
  ramadanDays,
  onSuccess,
}: CreateTaskModalProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [taskName, setTaskName] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isNewCategory, setIsNewCategory] = useState(false);
  
  const [schedule, setSchedule] = useState<ScheduleData>({
    type: "one-time",
    time: "12:00",
  });

  const resetForm = () => {
    setStep(1);
    setTaskName("");
    setSelectedSectionId("");
    setNewCategoryName("");
    setIsNewCategory(false);
    setSchedule({ type: "one-time", time: "12:00" });
    setError(null);
  };

  const handleClose = () => {
    if (taskName || selectedSectionId || newCategoryName) {
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

      const taskId = taskData.task.id;

      // 3. Schedule Task
      const duration = 30; // default

        // Helper to schedule call
        const scheduleCall = async (day: number, time: string) => {
             await fetch("/api/daily-tracker", {
                method: "POST",
                body: JSON.stringify({
                    taskId,
                    dayNumber: day,
                    time,
                    duration
                })
             });
        };

        if (schedule.type === "one-time") {
             if (schedule.dayNumber) {
                 await scheduleCall(schedule.dayNumber, schedule.time);
             }
        } else {
            // Recurring
            const daysToSchedule = ramadanDays.filter(d => {
                if (schedule.recurrenceType === "daily") return true;
                if (schedule.recurrenceType === "weekly") {
                    return schedule.daysOfWeek?.includes(d.gregorianDate.getDay());
                }
                return false;
            });

            for (const day of daysToSchedule) {
                 const times = (schedule.times && schedule.times.length > 0) 
                    ? schedule.times 
                    : [schedule.time];

                 for (const t of times) {
                     await scheduleCall(day.dayNumber, t);
                 }
            }
        }

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
      title="مهمة جديدة"
    >
      <div className="space-y-6">
        {/* Steps Indicator */}
        <div className="flex items-center justify-between mb-8 relative">
            <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-slate-100 dark:bg-slate-800 -z-10" />
            {[1, 2, 3, 4, 5].map((s) => (
                <div 
                    key={s}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        step >= s 
                        ? "bg-emerald-600 text-white" 
                        : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                    }`}
                >
                    {s}
                </div>
            ))}
        </div>

        {/* Step Content */}
        {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-8 duration-300">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
                    اسم المهمة
                </label>
                <input
                    autoFocus
                    type="text"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-right"
                    placeholder="مثال: قراءة جزء..."
                    value={taskName}
                    onChange={(e) => setTaskName(e.target.value)}
                />
            </div>
        )}

        {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-8 duration-300">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
                    تعيين إلى قسم (تصنيف)
                </label>
                
                <div className="flex gap-4 mb-4">
                     <button 
                        onClick={() => setIsNewCategory(false)}
                        className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-all ${!isNewCategory ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'border-slate-200 text-slate-500'}`}
                     >
                        قسم موجود
                     </button>
                     <button 
                        onClick={() => setIsNewCategory(true)}
                        className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-all ${isNewCategory ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'border-slate-200 text-slate-500'}`}
                     >
                        قسم جديد
                     </button>
                </div>

                {!isNewCategory ? (
                    sections.length > 0 ? (
                        <select
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-emerald-500 transition-all text-right dir-rtl"
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
                    ) : (
                        <div className="text-center p-4 bg-amber-50 rounded-xl text-amber-600 text-sm">
                            لا توجد أقسام حالية. يرجى إنشاء قسم جديد.
                        </div>
                    )
                ) : (
                    <input
                        autoFocus
                        type="text"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-right"
                        placeholder="اسم القسم الجديد..."
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                    />
                )}
            </div>
        )}

        {step === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-8 duration-300">
                 <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">
                    نوع التكرار
                </label>
                <div className="grid grid-cols-2 gap-4">
                    <button
                    onClick={() => setSchedule({...schedule, type: "one-time"})}
                    className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${
                        schedule.type === "one-time"
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
                        : "border-slate-200 dark:border-slate-800 hover:border-emerald-200"
                    }`}
                    >
                        <span className="font-bold text-lg">مرة واحدة</span>
                        <span className="text-xs opacity-70">يوم واحد محدد في رمضان</span>
                    </button>
                    <button
                    onClick={() => setSchedule({...schedule, type: "recurring", recurrenceType: "daily"})}
                    className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${
                        schedule.type === "recurring"
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
                        : "border-slate-200 dark:border-slate-800 hover:border-emerald-200"
                    }`}
                    >
                        <span className="font-bold text-lg">متكرر</span>
                        <span className="text-xs opacity-70">يومياً أو أسبوعياً</span>
                    </button>
                </div>
            </div>
        )}

        {step === 4 && (
             <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
                <ScheduleForm 
                    value={schedule}
                    onChange={setSchedule}
                    ramadanDays={ramadanDays}
                    allowMultipleTimes={schedule.type === "recurring"}
                />
            </div>
        )}

        {step === 5 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-8 duration-300 text-right">
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2">
                        <span className="font-bold text-slate-900 dark:text-slate-100">{taskName}</span>
                        <span className="text-xs text-slate-500">المهمة</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2">
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                            {isNewCategory ? newCategoryName : sections.find(s => s.id === selectedSectionId)?.title}
                        </span>
                        <span className="text-xs text-slate-500">القسم</span>
                    </div>
                    <div className="flex justify-between items-center pb-2">
                        <span className="font-bold text-emerald-600 dir-rtl">
                            {schedule.type === "one-time" ? "مرة واحدة" : (schedule.recurrenceType === "daily" ? "يومياً" : "أسبوعياً")}
                        </span>
                        <span className="text-xs text-slate-500">التكرار</span>
                    </div>
                     <div className="flex justify-between items-center pt-2">
                         <div className="flex flex-col items-end">
                            {(schedule.times && schedule.type === "recurring") ? schedule.times.map((t, i) => (
                                <span key={i} className="font-bold text-slate-900 dark:text-slate-100">{t}</span>
                            )) : (
                                <span className="font-bold text-slate-900 dark:text-slate-100">{schedule.time}</span>
                            )}
                         </div>
                        <span className="text-xs text-slate-500">التوقيت</span>
                    </div>
                </div>
            </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-3 pt-6">
            {step < 5 ? (
                <button
                    onClick={() => setStep(s => s + 1)}
                    disabled={
                        (step === 1 && !taskName.trim()) ||
                        (step === 2 && !isNewCategory && !selectedSectionId) ||
                        (step === 2 && isNewCategory && !newCategoryName.trim())
                    }
                    className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    التالي
                </button>
            ) : (
                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all disabled:opacity-50"
                >
                    {loading ? "جاري الإنشاء..." : "تأكيد وإنشاء"}
                </button>
            )}
            
            {step > 1 ? (
                <button
                    onClick={() => setStep(s => s - 1)}
                    disabled={loading}
                    className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 py-3 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                >
                    السابق
                </button>
            ) : (
                <button
                    onClick={handleClose}
                    className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 py-3 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                >
                    إلغاء
                </button>
            )}
        </div>
        
        {error && (
            <p className="text-red-500 text-xs text-center mt-2 font-bold">{error}</p>
        )}
      </div>
    </Modal>
  );
}
