"use client";

import { useState } from "react";
import { Modal } from "./ui/modal";
import { ScheduleForm, ScheduleData } from "./schedule-form";
import { RamadanDay } from "@/lib/date-utils";

interface CreateCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  planId: string;
  ramadanDays: RamadanDay[];
  onSuccess: () => void;
}

export function CreateCategoryModal({
  isOpen,
  onClose,
  planId,
  ramadanDays,
  onSuccess,
}: CreateCategoryModalProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [categoryName, setCategoryName] = useState("");
  const [tasks, setTasks] = useState<string[]>([]);
  const [newTaskInput, setNewTaskInput] = useState("");
  const [schedule, setSchedule] = useState<ScheduleData>({
    type: "one-time",
    time: "12:00",
  });
  const [customizeTimePerTask, setCustomizeTimePerTask] = useState(false);
  const [taskTimes, setTaskTimes] = useState<Record<number, string>>({}); // index -> time

  const resetForm = () => {
    setStep(1);
    setCategoryName("");
    setTasks([]);
    setNewTaskInput("");
    setSchedule({ type: "one-time", time: "12:00" });
    setCustomizeTimePerTask(false);
    setTaskTimes({});
    setError(null);
  };

  const handleClose = () => {
    if (categoryName || tasks.length > 0) {
      if (confirm("هل تريد الإلغاء؟ سيتم فقدان ما أدخلته.")) {
        resetForm();
        onClose();
      }
    } else {
      resetForm();
      onClose();
    }
  };

  const addTask = () => {
    if (!newTaskInput.trim()) return;
    setTasks([...tasks, newTaskInput.trim()]);
    setNewTaskInput("");
  };

  const removeTask = (index: number) => {
    setTasks(tasks.filter((_, i) => i !== index));
    // Clean up custom time if exists
    const newTimes = { ...taskTimes };
    delete newTimes[index];
    setTaskTimes(newTimes);
  };

  const calculateTotalOccurrences = () => {
    if (schedule.type === "one-time") return 1;
    if (schedule.recurrenceType === "daily") return 30; // approx
    if (schedule.recurrenceType === "weekly") {
      const daysPerWeek = schedule.daysOfWeek?.length || 0;
      return daysPerWeek * 4; // approx 4 weeks
    }
    return 0;
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Create Section
      const sectionRes = await fetch("/api/sections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, title: categoryName }),
      });
      const sectionData = await sectionRes.json();
      if (!sectionRes.ok) throw new Error(sectionData.error || "فشل إنشاء القسم");

      const sectionId = sectionData.section.id;

      // 2. Create Tasks & Schedule them
      for (let i = 0; i < tasks.length; i++) {
        const taskTitle = tasks[i];
        
        // Create Task
        const taskRes = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sectionId, title: taskTitle, type: "regular" }),
        });
        const taskData = await taskRes.json();
        if (!taskRes.ok) throw new Error(taskData.error || "فشل إنشاء المهمة");

        const taskId = taskData.task.id;

        // Schedule Task
        // If customizeTimePerTask is true, use specific time, else use shared schedule time
        const timeToUse = customizeTimePerTask 
          ? (taskTimes[i] || schedule.time)
          : schedule.time;
        
        // We'll construct the schedule payload based on current schedule state
        // creating new payload to avoid mutating state
        const taskSchedule = {
          ...schedule,
          time: timeToUse,
          // If we have custom times per task, we ignore the 'times' array of the schedule form 
          // and treat it as single time for this iteration.
          // Unless shared schedule allowed multiple times? 
          // Requirement said: "Customize time per task... show a time picker per task" (singular)
        };

        // Call the daily-tracker API to schedule
        // We need to implement a way to handle batch scheduling or loop here.
        // The /api/daily-tracker takes { taskId, dayNumber, time, duration }
        // recurrence logic needs to happen here or in API?
        // The implementation_plan said logic uses getRamadanDays.
        // So we interpret schedule and make API calls.
        
        const duration = 30; // default

        if (taskSchedule.type === "one-time") {
             if (taskSchedule.dayNumber) {
                 await fetch("/api/daily-tracker", {
                    method: "POST",
                    body: JSON.stringify({
                        taskId,
                        dayNumber: taskSchedule.dayNumber,
                        time: taskSchedule.time,
                        duration
                    })
                 });
             }
        } else {
            // Recurring
            const daysToSchedule = ramadanDays.filter(d => {
                if (taskSchedule.recurrenceType === "daily") return true;
                if (taskSchedule.recurrenceType === "weekly") {
                    // d.gregorianDate.getDay() returns 0-6 (Sun-Sat)
                    // taskSchedule.daysOfWeek should match
                    return taskSchedule.daysOfWeek?.includes(d.gregorianDate.getDay());
                }
                return false;
            });

            for (const day of daysToSchedule) {
                 // Support multiple times per day if strictly in shared mode and user added multiple slots
                 // But if "Customize time per task" is on, we use single time `timeToUse`
                 const times = (!customizeTimePerTask && taskSchedule.times && taskSchedule.times.length > 0) 
                    ? taskSchedule.times 
                    : [timeToUse];

                 for (const t of times) {
                     await fetch("/api/daily-tracker", {
                        method: "POST",
                        body: JSON.stringify({
                            taskId,
                            dayNumber: day.dayNumber,
                            time: t,
                            duration
                        })
                     });
                 }
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
      title="إنشاء قسم جديد"
    >
      <div className="space-y-6">
        {/* Steps Indicator */}
        <div className="flex items-center justify-between mb-8 relative">
            <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-slate-100 dark:bg-slate-800 -z-10" />
            {[1, 2, 3, 4].map((s) => (
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
                    اسم القسم
                </label>
                <input
                    autoFocus
                    type="text"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-right"
                    placeholder="مثال: العبادات، القرآن..."
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                />
            </div>
        )}

        {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-8 duration-300">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
                    إضافة مهام (اختياري)
                </label>
                <div className="flex gap-2">
                    <button 
                        onClick={addTask}
                        disabled={!newTaskInput.trim()}
                        className="bg-emerald-600 text-white px-4 rounded-xl font-bold disabled:opacity-50"
                    >
                        إضافة
                    </button>
                    <input
                        type="text"
                        className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-right"
                        placeholder="اسم المهمة..."
                        value={newTaskInput}
                        onChange={(e) => setNewTaskInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addTask()}
                    />
                </div>

                <div className="space-y-2 mt-4 max-h-60 overflow-y-auto">
                    {tasks.map((task, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                            <button onClick={() => removeTask(idx)} className="text-red-400 hover:text-red-600">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                            </button>
                            <span className="font-medium text-slate-700 dark:text-slate-300">{task}</span>
                        </div>
                    ))}
                    {tasks.length === 0 && (
                        <p className="text-center text-slate-400 text-xs py-4">لا توجد مهام مضافة بعد</p>
                    )}
                </div>
            </div>
        )}

        {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
                <ScheduleForm 
                    value={schedule}
                    onChange={setSchedule}
                    ramadanDays={ramadanDays}
                    allowMultipleTimes={!customizeTimePerTask}
                />

                {tasks.length > 0 && (
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <div className={`w-12 h-6 rounded-full p-1 transition-colors ${customizeTimePerTask ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`}>
                                <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${customizeTimePerTask ? 'translate-x-0' : 'translate-x-6'}`} />
                            </div>
                            <input 
                                type="checkbox" 
                                className="hidden" 
                                checked={customizeTimePerTask} 
                                onChange={(e) => setCustomizeTimePerTask(e.target.checked)} 
                            />
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">تخصيص وقت لكل مهمة</span>
                        </label>
                    </div>
                )}

                {customizeTimePerTask && (
                    <div className="space-y-3 mt-4">
                        {tasks.map((task, idx) => (
                            <div key={idx} className="flex items-center justify-between gap-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                <input 
                                    type="time" 
                                    value={taskTimes[idx] || schedule.time}
                                    onChange={(e) => setTaskTimes({ ...taskTimes, [idx]: e.target.value })}
                                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 font-bold"
                                />
                                <span className="font-medium text-sm truncate flex-1 text-right">{task}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}

        {step === 4 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-8 duration-300 text-right">
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2">
                        <span className="font-bold text-slate-900 dark:text-slate-100">{categoryName}</span>
                        <span className="text-xs text-slate-500">اسم القسم</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2">
                        <span className="font-bold text-slate-900 dark:text-slate-100">{tasks.length} مهام</span>
                        <span className="text-xs text-slate-500">عدد المهام</span>
                    </div>
                    <div className="flex justify-between items-center pb-2">
                        <span className="font-bold text-emerald-600 dir-rtl">
                            {schedule.type === "one-time" ? "مرة واحدة" : (schedule.recurrenceType === "daily" ? "يومياً" : "أسبوعياً")}
                        </span>
                        <span className="text-xs text-slate-500">التكرار</span>
                    </div>
                </div>

                {tasks.length > 0 && (
                    <div className="max-h-40 overflow-y-auto space-y-2">
                        {tasks.map((t, i) => (
                             <div key={i} className="text-xs text-slate-600 dark:text-slate-400 flex justify-between px-2">
                                <span>{customizeTimePerTask ? (taskTimes[i] || schedule.time) : (schedule.times?.join(", ") || schedule.time)}</span>
                                <span>{t}</span>
                             </div>
                        ))}
                    </div>
                )}
            </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-3 pt-6">
            {step < 4 ? (
                <button
                    onClick={() => setStep(s => s + 1)}
                    disabled={(step === 1 && !categoryName.trim())}
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
