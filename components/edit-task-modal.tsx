"use client";

import { useState, useEffect } from "react";
import { Modal } from "./ui/modal";
import { ScheduleForm, ScheduleData } from "./schedule-form";
import { RamadanDay } from "@/lib/date-utils";
import { PlannerSection, PlannerTask } from "@/lib/types";

interface EditTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    task: PlannerTask;
    sectionId: string;
    sections: PlannerSection[];
    ramadanDays: RamadanDay[];
    onSuccess: () => void;
    planId: string; // Not strictly needed if schedule-recurring uses it, but good to have
    year: number;
    currentDay: number; // The day to start rescheduling from (e.g. today or selected day)
}

export function EditTaskModal({
    isOpen,
    onClose,
    task,
    sectionId: initialSectionId,
    sections,
    ramadanDays,
    onSuccess,
    planId,
    year,
    currentDay
}: EditTaskModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [selectedSectionId, setSelectedSectionId] = useState(initialSectionId);
    const [schedule, setSchedule] = useState<ScheduleData>({
        type: "one-time",
        time: "12:00",
    });

    // Reset state when opening or task changes
    useEffect(() => {
        if (isOpen) {
            setSelectedSectionId(initialSectionId);
            setSchedule({ type: "one-time", time: "12:00" });
            setError(null);
        }
    }, [isOpen, initialSectionId, task]);

    const handleClose = () => {
        onClose();
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError(null);

        try {
            // 1. Update Task Section if changed
            if (selectedSectionId !== initialSectionId) {
                const res = await fetch(`/api/tasks/${task.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ sectionId: selectedSectionId }),
                });
                if (!res.ok) throw new Error("فشل تحديث قسم المهمة");
            }

            // 2. Clear Future Schedules
            // We delete from currentDay onwards
            const deleteRes = await fetch(`/api/daily-tracker?taskId=${task.id}&future=true&fromDay=${currentDay}`, {
                method: "DELETE"
            });
            if (!deleteRes.ok) throw new Error("فشل حذف الجدولة القديمة");

            // 3. Create New Schedule
            // We use the new schedule-recurring endpoint which supports simple JSON
            const scheduleRes = await fetch("/api/tasks/schedule-recurring", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    planId,
                    year,
                    taskId: task.id,
                    sectionId: selectedSectionId,
                    title: task.title, // Just for validation if needed
                    scheduleType: schedule.type === "recurring" ? schedule.recurrenceType : "once",
                    selectedDate: schedule.dayNumber || currentDay, // Default to currentDay if not set
                    selectedDayOfWeek: schedule.daysOfWeek ? schedule.daysOfWeek[0] : 5, // Simple handling for now
                    time: schedule.time,
                    duration: 30 // Default or add to ScheduleForm?
                    // Note: ScheduleForm supports multiple times for recurring, but API might need adjusting if passed as array
                    // The API created supports `time` string but we map `times` array loop on Frontend?
                    // Or update API to accept array?
                    // `CreateTaskModal` loops and calls API for each time.
                    // `EditTaskModal` should do the same or update API.
                    // My creating API supports simple single time.
                    // Let's loop here if needed or simplify to single time for now.
                    // ScheduleForm allows multiple times.
                    // Let's implement the loop here.
                })
            });

            // Wait, ScheduleForm supports complex recurrence (multiple times).
            // My new API endpoint `schedule-recurring` supports simple types.
            // If I want to support complex recurrence, I should replicate `CreateTaskModal` logic:
            // Calculate days on Client and call `scheduleTasksBatch` indirectly via API?
            // Or call API multiple times?

            // Re-reading `CreateTaskModal`: it has a loop calling `scheduleCall` for each day/time.
            // `scheduleCall` calls `POST /api/daily-tracker`.
            // My new `schedule-recurring` API does batch insert for a single time/rule.
            // If `ScheduleForm` has multiple times, I should call `schedule-recurring` for each time?
            // Yes.

            const times = (schedule.type === "recurring" && schedule.times && schedule.times.length > 0)
                ? schedule.times
                : [schedule.time];

            // For each time slot, call the API
            // Note: Parallel calls might be race-y for "creation" if task didn't exist, but here task exists.

            await Promise.all(times.map(async (t) => {
                await fetch("/api/tasks/schedule-recurring", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        planId,
                        year,
                        taskId: task.id,
                        sectionId: selectedSectionId,
                        title: task.title,
                        scheduleType: schedule.type === "recurring" ? schedule.recurrenceType : "once",
                        selectedDate: schedule.dayNumber || currentDay, // fallback
                        selectedDayOfWeek: schedule.daysOfWeek ? schedule.daysOfWeek[0] : 5,
                        // Note: If multiple days of week selected? API supports one.
                        // `ScheduleForm` allows multiple days of week.
                        // `CreateTaskModal` handles this by filtering days manually.
                        // Ideally checking `CreateTaskModal` logic again:
                        // It loops through days and times and calls `daily-tracker` individually.

                        // Using `schedule-recurring` API which does batching is better but it needs to support multiple days/times or be called multiple times.
                        // My API supports `scheduleType='weekly'` and `selectedDayOfWeek` (single).
                        // If `ScheduleForm` allows multiple days (e.g. Sat & Sun), I need to call API for each.

                        time: t,
                        duration: 30
                    })
                });
            }));

            // Wait, if `daysOfWeek` has multiple, I need to loop them too.
            if (schedule.type === "recurring" && schedule.recurrenceType === "weekly" && schedule.daysOfWeek) {
                // For each day of week, call API
                // This is getting complicated.
                // Maybe I should just use the same loop logic as CreateTaskModal but calling `daily-tracker` directly?
                // But `daily-tracker` is single insert.
                // `schedule-recurring` is batch.
                // Batch is efficient.
                // Calls = (Num Times) * (Num DaysOfWeek). Max 5 * 7 = 35 calls. It's fine.

                // Actually, `schedule-recurring` takes `selectedDayOfWeek`.
                // So I can loop `daysOfWeek`.
            }

            if (!scheduleRes.ok && times.length === 1) throw new Error("فشل جدولة المهمة");

            onSuccess();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
        } finally {
            setLoading(false);
        }
    };

    // Improved Submit Logic to handle multiple days/times
    const handleAdvancedSubmit = async () => {
        setLoading(true);
        setError(null);

        try {
            // 1. Update Section
            if (selectedSectionId !== initialSectionId) {
                await fetch(`/api/tasks/${task.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ sectionId: selectedSectionId }),
                });
            }

            // 2. Clear Future
            await fetch(`/api/daily-tracker?taskId=${task.id}&future=true&fromDay=${currentDay}`, {
                method: "DELETE"
            });

            // 3. Schedule
            const calls = [];
            const times = (schedule.type === "recurring" && schedule.times?.length) ? schedule.times : [schedule.time];

            if (schedule.type === "one-time") {
                // Single day, multiple times?
                for (const t of times) {
                    calls.push(fetch("/api/tasks/schedule-recurring", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            planId, year, taskId: task.id, sectionId: selectedSectionId, title: task.title,
                            scheduleType: "once",
                            selectedDate: schedule.dayNumber || currentDay,
                            time: t, duration: 30
                        })
                    }));
                }
            } else if (schedule.recurrenceType === "daily") {
                // Daily, multiple times
                for (const t of times) {
                    calls.push(fetch("/api/tasks/schedule-recurring", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            planId, year, taskId: task.id, sectionId: selectedSectionId, title: task.title,
                            scheduleType: "daily",
                            time: t, duration: 30
                        })
                    }));
                }
            } else if (schedule.recurrenceType === "weekly") {
                // Weekly, multiple days, multiple times
                const days = schedule.daysOfWeek || [5];
                for (const d of days) {
                    for (const t of times) {
                        calls.push(fetch("/api/tasks/schedule-recurring", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                planId, year, taskId: task.id, sectionId: selectedSectionId, title: task.title,
                                scheduleType: "weekly",
                                selectedDayOfWeek: d,
                                time: t, duration: 30
                            })
                        }));
                    }
                }
            }

            await Promise.all(calls);
            onSuccess();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "حدث خطأ");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="تعديل المهمة وجدولتها"
        >
            <div className="space-y-6">
                {/* 1. Task Name (Read Only) */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                        اسم المهمة
                    </label>
                    <input
                        type="text"
                        disabled
                        value={task.title}
                        className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-500 cursor-not-allowed font-bold"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                        لا يمكن تعديل اسم المهمة. لإنشاء مهمة مختلفة، استخدم "إضافة مهمة جديدة".
                    </p>
                </div>

                {/* 2. Category Selection */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                        القسم (التصنيف)
                    </label>
                    <select
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-emerald-500 transition-all text-right dir-rtl"
                        value={selectedSectionId}
                        onChange={(e) => setSelectedSectionId(e.target.value)}
                    >
                        {sections.map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.title}
                            </option>
                        ))}
                    </select>
                </div>

                {/* 3. Schedule Form */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
                    <label className="block text-sm font-bold text-emerald-700 dark:text-emerald-400 mb-4 flex items-center gap-2">
                        إعادة الجدولة (سيتم تحديث المواعيد المستقبلية فقط)
                    </label>
                    <ScheduleForm
                        value={schedule}
                        onChange={setSchedule}
                        ramadanDays={ramadanDays}
                        allowMultipleTimes={schedule.type === "recurring"}
                    />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
                    <button
                        onClick={handleAdvancedSubmit}
                        disabled={loading}
                        className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : "حفظ التغييرات"}
                    </button>
                    <button
                        onClick={handleClose}
                        disabled={loading}
                        className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 py-3 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                    >
                        إلغاء
                    </button>
                </div>

                {error && (
                    <p className="text-red-500 text-xs text-center mt-2 font-bold bg-red-50 dark:bg-red-900/10 p-2 rounded-lg border border-red-100 dark:border-red-900/20">
                        {error}
                    </p>
                )}
            </div>
        </Modal>
    );
}
