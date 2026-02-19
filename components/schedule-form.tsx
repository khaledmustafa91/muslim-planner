"use client";

import { useState, useEffect } from "react";
import { RamadanDay } from "@/lib/date-utils";

export interface ScheduleData {
  type: "none" | "one-time" | "recurring";
  // One-time
  date?: string; // stored as ISO date string or just YYYY-MM-DD
  dayNumber?: number; // 1-30
  time: string;
  // Recurring
  recurrenceType?: "daily" | "weekly";
  daysOfWeek?: number[]; // 0-6 (Sun-Sat)
  times?: string[]; // Array of time strings for multiple slots
}

interface ScheduleFormProps {
  value: ScheduleData;
  onChange: (data: ScheduleData) => void;
  ramadanDays: RamadanDay[];
  allowMultipleTimes?: boolean;
}

export function ScheduleForm({
  value,
  onChange,
  ramadanDays,
  allowMultipleTimes = false,
}: ScheduleFormProps) {
  const [activeType, setActiveType] = useState<"none" | "one-time" | "recurring">(
    value.type
  );

  // Sync internal state with prop if needed, or just use props directly
  const handleTypeChange = (type: "none" | "one-time" | "recurring") => {
    setActiveType(type);
    onChange({ ...value, type });
  };

  const weekDays = [
    { id: 0, label: "الأحد" },
    { id: 1, label: "الاثنين" },
    { id: 2, label: "الثلاثاء" },
    { id: 3, label: "الأربعاء" },
    { id: 4, label: "الخميس" },
    { id: 5, label: "الجمعة" },
    { id: 6, label: "السبت" },
  ];

  const toggleDay = (dayId: number) => {
    const currentDays = value.daysOfWeek || [];
    const newDays = currentDays.includes(dayId)
      ? currentDays.filter((d) => d !== dayId)
      : [...currentDays, dayId];
    onChange({ ...value, daysOfWeek: newDays });
  };

  const addTimeSlot = () => {
    if (!allowMultipleTimes) return;
    const currentTimes = value.times || [value.time];
    onChange({ ...value, times: [...currentTimes, "12:00"] });
  };

  const removeTimeSlot = (index: number) => {
    const currentTimes = value.times || [];
    if (currentTimes.length <= 1) return;
    const newTimes = currentTimes.filter((_, i) => i !== index);
    onChange({ ...value, times: newTimes });
  };

  const updateTimeSlot = (index: number, newTime: string) => {
    const currentTimes = value.times ? [...value.times] : [value.time];
    currentTimes[index] = newTime;
    // Also update the main 'time' field for backward compatibility or primary slot
    onChange({ ...value, times: currentTimes, time: index === 0 ? newTime : value.time });
  };

  return (
    <div className="space-y-6">
      {/* Type Selection */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => handleTypeChange("none")}
          className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
            activeType === "none"
              ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
              : "border-slate-200 dark:border-slate-800 hover:border-emerald-200 dark:hover:border-slate-700"
          }`}
        >
          <div className={`w-3 h-3 rounded-full ${activeType === "none" ? "bg-emerald-500" : "bg-slate-300"}`} />
          <span className="font-bold text-sm">بدون جدولة</span>
        </button>
        <button
          onClick={() => handleTypeChange("one-time")}
          className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
            activeType === "one-time"
              ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
              : "border-slate-200 dark:border-slate-800 hover:border-emerald-200 dark:hover:border-slate-700"
          }`}
        >
          <div className={`w-3 h-3 rounded-full ${activeType === "one-time" ? "bg-emerald-500" : "bg-slate-300"}`} />
          <span className="font-bold text-sm">مرة واحدة</span>
        </button>
        <button
          onClick={() => handleTypeChange("recurring")}
          className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
            activeType === "recurring"
              ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
              : "border-slate-200 dark:border-slate-800 hover:border-emerald-200 dark:hover:border-slate-700"
          }`}
        >
          <div className={`w-3 h-3 rounded-full ${activeType === "recurring" ? "bg-emerald-500" : "bg-slate-300"}`} />
          <span className="font-bold text-sm">متكرر</span>
        </button>
      </div>

      {/* Details */}
      <div className="animate-in fade-in slide-in-from-top-4 duration-300 space-y-4">
        {activeType === "none" ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
            ستُضاف المهمة إلى الخطة بدون تحديد يوم أو وقت
          </p>
        ) : activeType === "one-time" ? (
          <>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                اليوم
              </label>
              <select
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-emerald-500 transition-all text-right"
                value={value.dayNumber || ""}
                onChange={(e) =>
                  onChange({ ...value, dayNumber: Number(e.target.value) })
                }
              >
                <option value="">-- اختر اليوم --</option>
                {ramadanDays.map((d) => (
                  <option key={d.dayNumber} value={d.dayNumber}>
                    {d.dayNumber} رمضان - {d.dayName} ({d.formattedGregorian})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                الوقت
              </label>
              <input
                type="time"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-lg font-bold focus:ring-2 focus:ring-emerald-500 transition-all"
                value={value.time}
                onChange={(e) => onChange({ ...value, time: e.target.value })}
              />
            </div>
          </>
        ) : (
          <>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => onChange({ ...value, recurrenceType: "daily" })}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                  value.recurrenceType === "daily"
                    ? "bg-white dark:bg-slate-700 shadow text-emerald-700 dark:text-emerald-400"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                يومياً
              </button>
              <button
                onClick={() => onChange({ ...value, recurrenceType: "weekly" })}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                  value.recurrenceType === "weekly"
                    ? "bg-white dark:bg-slate-700 shadow text-emerald-700 dark:text-emerald-400"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                أسبوعياً
              </button>
            </div>

            {value.recurrenceType === "weekly" && (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                  أيام التكرار
                </label>
                <div className="flex flex-wrap gap-2">
                  {weekDays.map((day) => (
                    <button
                      key={day.id}
                      onClick={() => toggleDay(day.id)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                        value.daysOfWeek?.includes(day.id)
                          ? "bg-emerald-500 border-emerald-500 text-white shadow-md"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-emerald-300"
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2 flex justify-between items-center">
                <span>الوقت</span>
                {allowMultipleTimes && (
                  <button
                    onClick={addTimeSlot}
                    className="text-emerald-600 hover:text-emerald-700 text-[10px] flex items-center gap-1"
                  >
                    + إضافة وقت آخر
                  </button>
                )}
              </label>
              
              <div className="space-y-2">
                {allowMultipleTimes && value.times && value.times.length > 0 ? (
                  value.times.map((t, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="time"
                        className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-lg font-bold focus:ring-2 focus:ring-emerald-500 transition-all"
                        value={t}
                        onChange={(e) => updateTimeSlot(idx, e.target.value)}
                      />
                      {value.times && value.times.length > 1 && (
                        <button
                          onClick={() => removeTimeSlot(idx)}
                          className="px-3 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <input
                    type="time"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-lg font-bold focus:ring-2 focus:ring-emerald-500 transition-all"
                    value={value.time}
                    onChange={(e) => onChange({ ...value, time: e.target.value })}
                  />
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
