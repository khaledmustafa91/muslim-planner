"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import type { PlanResponse, PlannerSection, PlannerTask } from "@/lib/types";
import { Modal } from "./ui/modal";

// --- Icons ---
const IconCheck = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconMoon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="#fcd34d" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
  </svg>
);

const IconTrash = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
);

const IconEdit = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
);

const IconPlus = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
);

const IconUp = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
);

const IconDown = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
);

// --- Helpers ---
function checkinKey(taskId: string, day: number): string {
  return `${taskId}-${day}`;
}

async function api<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    }
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error ?? "حدث خطأ غير متوقع");
  }

  return data as T;
}

// --- Components ---
function Skeleton() {
  return (
    <div className="animate-pulse space-y-8 p-4">
      <div className="h-40 bg-slate-200 rounded-xl" />
      <div className="space-y-4">
        <div className="h-8 bg-slate-200 w-1/4 rounded" />
        <div className="h-64 bg-slate-100 rounded-lg" />
      </div>
    </div>
  );
}

export function PlannerClient({ username }: { username: string }) {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState<number>(currentYear);
  const [plan, setPlan] = useState<PlanResponse | null>(null);
  const [checkins, setCheckins] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Modal States ---
  const [modalType, setModalType] = useState<"add-section" | "edit-section" | "add-task" | "edit-task" | "delete-confirm" | "reset-confirm" | null>(null);
  const [modalData, setModalData] = useState<any>(null);
  const [modalInputValue, setModalInputValue] = useState("");

  const loadPlan = useCallback(async (selectedYear: number, showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const data = await api<PlanResponse>(`/api/plan?year=${selectedYear}`);
      setPlan(data);

      const map: Record<string, boolean> = {};
      for (const checkin of data.checkins) {
        map[checkinKey(checkin.taskId, checkin.dayNumber)] = checkin.done;
      }
      setCheckins(map);
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر تحميل الخطة");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlan(year);
  }, [year, loadPlan]);

  const days = useMemo(() => {
    const count = plan?.dayCount ?? 30;
    return Array.from({ length: count }, (_, i) => i + 1);
  }, [plan?.dayCount]);

  const taskCount = useMemo(() => {
    if (!plan) return 0;
    return plan.sections.reduce((acc, section) => acc + section.tasks.length, 0);
  }, [plan]);

  const progress = useMemo(() => {
    if (!plan || taskCount === 0) return 0;
    let completed = 0;
    for (const section of plan.sections) {
      for (const task of section.tasks) {
        for (const day of days) {
          if (checkins[checkinKey(task.id, day)]) completed += 1;
        }
      }
    }
    const total = taskCount * days.length;
    return total === 0 ? 0 : Math.round((completed / total) * 100);
  }, [checkins, days, plan, taskCount]);

  // --- Actions ---
  async function toggleTask(taskId: string, day: number) {
    const key = checkinKey(taskId, day);
    const next = !checkins[key];
    
    // Optimistic Update
    setCheckins((prev) => ({ ...prev, [key]: next }));

    try {
      await api<{ ok: true }>("/api/checkins/toggle", {
        method: "POST",
        body: JSON.stringify({ taskId, dayNumber: day, done: next })
      });
    } catch {
      // Revert on failure
      setCheckins((prev) => ({ ...prev, [key]: !next }));
      setError("تعذر حفظ التغيير");
    }
  }

  const handleModalSubmit = async () => {
    if (!modalType) return;
    
    const value = modalInputValue.trim();
    if (!value && modalType !== "delete-confirm") return;

    setSubmitting(true);
    try {
      if (modalType === "add-section" && plan) {
        await api("/api/sections", {
          method: "POST",
          body: JSON.stringify({ planId: plan.planId, title: value })
        });
      } else if (modalType === "edit-section") {
        await api(`/api/sections/${modalData.id}`, {
          method: "PATCH",
          body: JSON.stringify({ title: value })
        });
      } else if (modalType === "add-task") {
        await api("/api/tasks", {
          method: "POST",
          body: JSON.stringify({ sectionId: modalData.sectionId, title: value })
        });
      } else if (modalType === "edit-task") {
        await api(`/api/tasks/${modalData.id}`, {
          method: "PATCH",
          body: JSON.stringify({ title: value })
        });
      } else if (modalType === "delete-confirm") {
        const url = modalData.type === "section" ? `/api/sections/${modalData.id}` : `/api/tasks/${modalData.id}`;
        await api(url, { method: "DELETE" });
      } else if (modalType === "reset-confirm" && plan) {
        const actions: Array<Promise<unknown>> = [];
        for (const section of plan.sections) {
          for (const task of section.tasks) {
            for (const day of days) {
              if (checkins[checkinKey(task.id, day)]) {
                actions.push(
                  api("/api/checkins/toggle", {
                    method: "POST",
                    body: JSON.stringify({ taskId: task.id, dayNumber: day, done: false })
                  })
                );
              }
            }
          }
        }
        await Promise.all(actions);
      }

      setModalType(null);
      await loadPlan(year, false); // Reload in background
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setSubmitting(false);
    }
  };

  async function moveSection(sectionId: string, direction: "up" | "down") {
    if (!plan) return;
    const sorted = [...plan.sections].sort((a, b) => a.order - b.order);
    const index = sorted.findIndex((s) => s.id === sectionId);
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (index < 0 || targetIndex < 0 || targetIndex >= sorted.length) return;

    const current = sorted[index];
    const target = sorted[targetIndex];

    // Optimistic re-order
    const nextSections = [...plan.sections];
    const curIdx = nextSections.findIndex(s => s.id === current.id);
    const tarIdx = nextSections.findIndex(s => s.id === target.id);
    const tempOrder = nextSections[curIdx].order;
    nextSections[curIdx].order = nextSections[tarIdx].order;
    nextSections[tarIdx].order = tempOrder;
    setPlan({ ...plan, sections: nextSections });

    try {
      await Promise.all([
        api(`/api/sections/${current.id}`, { method: "PATCH", body: JSON.stringify({ order: target.order }) }),
        api(`/api/sections/${target.id}`, { method: "PATCH", body: JSON.stringify({ order: current.order }) })
      ]);
    } catch {
      setError("تعذر إعادة ترتيب الأقسام");
      await loadPlan(year, false);
    }
  }

  async function moveTask(sectionId: string, taskId: string, direction: "up" | "down") {
    if (!plan) return;
    const section = plan.sections.find((entry) => entry.id === sectionId);
    if (!section) return;

    const sorted = [...section.tasks].sort((a, b) => a.order - b.order);
    const index = sorted.findIndex((task) => task.id === taskId);
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (index < 0 || targetIndex < 0 || targetIndex >= sorted.length) return;

    const current = sorted[index];
    const target = sorted[targetIndex];

    // Optimistic re-order
    const nextSections = plan.sections.map(s => {
      if (s.id !== sectionId) return s;
      const nextTasks = [...s.tasks];
      const curIdx = nextTasks.findIndex(t => t.id === current.id);
      const tarIdx = nextTasks.findIndex(t => t.id === target.id);
      const tempOrder = nextTasks[curIdx].order;
      nextTasks[curIdx].order = nextTasks[tarIdx].order;
      nextTasks[tarIdx].order = tempOrder;
      return { ...s, tasks: nextTasks };
    });
    setPlan({ ...plan, sections: nextSections });

    try {
      await Promise.all([
        api(`/api/tasks/${current.id}`, { method: "PATCH", body: JSON.stringify({ order: target.order }) }),
        api(`/api/tasks/${target.id}`, { method: "PATCH", body: JSON.stringify({ order: current.order }) })
      ]);
    } catch {
      setError("تعذر إعادة ترتيب المهام");
      await loadPlan(year, false);
    }
  }

  async function moveTaskToSection(taskId: string, currentSectionId: string, nextSectionId: string) {
    if (!plan) return;
    
    // Optimistic move
    const task = plan.sections.find(s => s.id === currentSectionId)?.tasks.find(t => t.id === taskId);
    if (!task) return;

    const nextSections = plan.sections.map(s => {
      if (s.id === currentSectionId) {
        return { ...s, tasks: s.tasks.filter(t => t.id !== taskId) };
      }
      if (s.id === nextSectionId) {
        return { ...s, tasks: [...s.tasks, { ...task, sectionId: nextSectionId, order: 9999 }] };
      }
      return s;
    });
    setPlan({ ...plan, sections: nextSections });

    try {
      await api(`/api/tasks/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify({ sectionId: nextSectionId, order: 9999 })
      });
      await loadPlan(year, false);
    } catch {
      setError("تعذر نقل المهمة");
      await loadPlan(year, false);
    }
  }

  async function updateDayCount(dayCount: 29 | 30) {
    if (!plan) return;
    setPlan({ ...plan, dayCount }); // Optimistic

    try {
      await api("/api/plan/settings", {
        method: "PATCH",
        body: JSON.stringify({ planId: plan.planId, dayCount })
      });
    } catch {
      setError("تعذر تعديل عدد الأيام");
      await loadPlan(year, false);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  const yearOptions = useMemo(() => {
    const years = [];
    for (let i = 0; i <= 5; i++) {
      years.push(currentYear + i);
    }
    return years;
  }, [currentYear]);

  if (loading) return <Skeleton />;
  if (!plan) return <div className="p-10 text-center">لا توجد بيانات لهذه السنة</div>;

  return (
    <div className="min-h-screen pb-20 bg-slate-50">
      <header className="bg-emerald-800 text-white py-6 shadow-lg no-print sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="bg-emerald-700 p-2.5 rounded-2xl shadow-inner">
                <IconMoon />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold font-amiri tracking-wide">رفيق المسلم</h1>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs text-emerald-100/80 font-medium">مرحباً بك، {username}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 items-center justify-center">
              <div className="relative group">
                <select
                  className="appearance-none bg-emerald-900/50 border border-emerald-600 text-white rounded-xl pl-10 pr-4 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all cursor-pointer"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                >
                  {yearOptions.map(y => (
                    <option key={y} value={y} className="text-slate-900">{y} هـ / م</option>
                  ))}
                </select>
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-emerald-300">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                </div>
              </div>

              <div className="flex bg-emerald-900/40 p-1 rounded-xl border border-emerald-600/50">
                <button
                  onClick={() => updateDayCount(29)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${plan.dayCount === 29 ? "bg-amber-400 text-emerald-950 shadow-md" : "text-emerald-100 hover:bg-emerald-800/50"}`}
                >
                  29 يوم
                </button>
                <button
                  onClick={() => updateDayCount(30)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${plan.dayCount === 30 ? "bg-amber-400 text-emerald-950 shadow-md" : "text-emerald-100 hover:bg-emerald-800/50"}`}
                >
                  30 يوم
                </button>
              </div>

              <button onClick={() => window.print()} className="bg-emerald-50 text-emerald-800 px-4 py-2 rounded-xl text-sm font-bold hover:bg-white transition-colors shadow-sm flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>
                طباعة
              </button>
              
              <button 
                onClick={() => { setModalType("add-section"); setModalInputValue(""); }} 
                className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-emerald-500 transition-colors shadow-sm flex items-center gap-2"
              >
                <IconPlus /> إضافة قسم
              </button>

              <button 
                onClick={() => setModalType("reset-confirm")} 
                className="bg-amber-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-amber-600 transition-colors shadow-sm flex items-center gap-2"
              >
                تصفير المتابعة
              </button>

              <button onClick={logout} className="bg-slate-800 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-700 transition-colors">
                خروج
              </button>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-2">
            <div className="flex justify-between items-end mb-1">
              <span className="text-xs font-bold text-emerald-200 uppercase tracking-wider">إنجازك العام</span>
              <span className="text-lg font-black text-amber-400">{progress}%</span>
            </div>
            <div className="w-full bg-emerald-950/50 rounded-full h-3.5 p-0.5 shadow-inner">
              <div 
                className="bg-gradient-to-l from-amber-400 to-amber-300 h-2.5 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(251,191,36,0.5)]" 
                style={{ width: `${progress}%` }} 
              />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 mt-8">
        <div className="print-only text-center mb-10 border-b-4 border-emerald-800 pb-6">
          <h1 className="text-4xl font-bold font-amiri text-emerald-900">جدول متابعة رمضان {year}</h1>
          <p className="text-emerald-700 mt-2 text-xl font-amiri">"وَفِي ذَلِكَ فَلْيَتَنَافَسِ الْمُتَنَافِسُونَ"</p>
        </div>

        {plan.sections
          .sort((a, b) => a.order - b.order)
          .map((section) => (
            <section key={section.id} className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden mb-8 transition-all hover:shadow-md">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center gap-4 justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
                    {section.title.charAt(0)}
                  </div>
                  <h2 className="font-bold text-slate-800 text-lg">{section.title}</h2>
                </div>
                
                <div className="no-print flex flex-wrap gap-2 items-center">
                  <button 
                    onClick={() => { setModalType("add-task"); setModalData({ sectionId: section.id }); setModalInputValue(""); }} 
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold hover:bg-emerald-100 transition-colors"
                  >
                    <IconPlus /> مهمة جديدة
                  </button>
                  <div className="w-px h-4 bg-slate-200 mx-1" />
                  <button onClick={() => { setModalType("edit-section"); setModalData(section); setModalInputValue(section.title); }} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-all" title="تعديل">
                    <IconEdit />
                  </button>
                  <button onClick={() => moveSection(section.id, "up")} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-all" title="للأعلى">
                    <IconUp />
                  </button>
                  <button onClick={() => moveSection(section.id, "down")} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-all" title="للأسفل">
                    <IconDown />
                  </button>
                  <button onClick={() => { setModalType("delete-confirm"); setModalData({ type: "section", id: section.id, title: section.title }); }} className="p-1.5 rounded-lg text-red-300 hover:bg-red-50 hover:text-red-600 transition-all" title="حذف">
                    <IconTrash />
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 text-slate-500 border-b border-slate-100 text-xs uppercase tracking-tighter">
                      <th className="p-4 min-w-[260px] sticky right-0 bg-slate-50 border-l border-slate-100 z-10 text-right font-black">المهمة اليومية</th>
                      {days.map((d) => (
                        <th key={d} className="p-1 min-w-[36px] text-center border-l border-slate-50/50 font-bold">{d}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {section.tasks
                      .sort((a, b) => a.order - b.order)
                      .map((task, idx) => (
                        <tr key={task.id} className="group border-b border-slate-50 hover:bg-slate-50/30 transition-colors">
                          <td className="p-3 md:p-4 font-medium text-slate-700 sticky right-0 border-l border-slate-50 z-10 bg-inherit shadow-[4px_0_8px_-4px_rgba(0,0,0,0.05)]">
                            <div className="flex justify-between items-center gap-4">
                              <div className="flex items-center gap-3">
                                <span className="w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-lg bg-slate-100 text-slate-500 text-[10px] font-bold group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors">{idx + 1}</span>
                                <span className="text-slate-800 font-medium whitespace-nowrap">{task.title}</span>
                              </div>

                              <div className="no-print flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => { setModalType("edit-task"); setModalData(task); setModalInputValue(task.title); }} className="p-1.5 rounded-md text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-all">
                                  <IconEdit />
                                </button>
                                <button onClick={() => moveTask(section.id, task.id, "up")} className="p-1.5 rounded-md text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-all">
                                  <IconUp />
                                </button>
                                <button onClick={() => moveTask(section.id, task.id, "down")} className="p-1.5 rounded-md text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-all">
                                  <IconDown />
                                </button>
                                <select
                                  className="mx-1 px-1 rounded bg-slate-100 text-[10px] border-none focus:ring-1 focus:ring-emerald-400 cursor-pointer"
                                  value={section.id}
                                  onChange={(e) => moveTaskToSection(task.id, section.id, e.target.value)}
                                >
                                  {plan.sections.map((entry) => (
                                    <option key={entry.id} value={entry.id}>{entry.title}</option>
                                  ))}
                                </select>
                                <button onClick={() => { setModalType("delete-confirm"); setModalData({ type: "task", id: task.id, title: task.title }); }} className="p-1.5 rounded-md text-red-300 hover:bg-red-50 hover:text-red-600 transition-all">
                                  <IconTrash />
                                </button>
                              </div>
                            </div>
                          </td>

                          {days.map((day) => {
                            const done = checkins[checkinKey(task.id, day)] ?? false;
                            return (
                              <td key={day} className="p-0 border-l border-slate-50 text-center relative h-12">
                                <div
                                  onClick={() => toggleTask(task.id, day)}
                                  className={`checkbox-wrapper w-full h-full flex items-center justify-center cursor-pointer select-none no-print transition-all duration-300 ${done ? "bg-emerald-50/50" : "hover:bg-slate-100/50"}`}
                                >
                                  <div className={`w-6 h-6 rounded-md border-2 transition-all flex items-center justify-center ${done ? "bg-emerald-100 border-emerald-500 scale-110 shadow-sm" : "bg-white border-slate-200"}`}>
                                    {done ? <IconCheck /> : null}
                                  </div>
                                </div>
                                <div className="print-only w-full h-full border-l border-slate-300 flex items-center justify-center">
                                  {done ? <div className="w-3 h-3 bg-slate-800 rounded-sm" /> : null}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}

        <div className="mt-12 text-center text-slate-400 text-xs no-print flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>يتم حفظ جميع التغييرات تلقائياً</span>
          </div>
          <p>© {new Date().getFullYear()} رمضان مبارك</p>
        </div>
      </main>

      {/* --- Modals --- */}
      <Modal 
        isOpen={!!modalType} 
        onClose={() => setModalType(null)} 
        title={
          modalType === "add-section" ? "إضافة قسم جديد" :
          modalType === "edit-section" ? "تعديل القسم" :
          modalType === "add-task" ? "إضافة مهمة جديدة" :
          modalType === "edit-task" ? "تعديل المهمة" :
          modalType === "reset-confirm" ? "تصفير المتابعة" :
          "تأكيد الحذف"
        }
      >
        {modalType === "reset-confirm" ? (
          <div className="space-y-4">
            <p className="text-slate-600">هل تريد تصفير المتابعة للسنة الحالية <span className="font-bold text-slate-900">{year}</span>؟</p>
            <p className="text-xs text-amber-600">هذا الإجراء لا يمكن التراجع عنه.</p>
            <div className="flex gap-3 pt-2">
              <button 
                onClick={handleModalSubmit}
                disabled={submitting}
                className="flex-1 bg-amber-500 text-white py-2.5 rounded-xl font-bold hover:bg-amber-600 transition-colors disabled:opacity-50"
              >
                {submitting ? "جاري التصفير..." : "نعم، تصفير"}
              </button>
              <button 
                onClick={() => setModalType(null)}
                className="flex-1 bg-slate-100 text-slate-600 py-2.5 rounded-xl font-bold hover:bg-slate-200 transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        ) : modalType === "delete-confirm" ? (
          <div className="space-y-4">
            <p className="text-slate-600">هل أنت متأكد من حذف <span className="font-bold text-slate-900">{modalData?.title}</span>؟</p>
            {modalData?.type === "section" && <p className="text-xs text-red-500">سيتم حذف جميع المهام التابعة لهذا القسم أيضاً.</p>}
            <div className="flex gap-3 pt-2">
              <button 
                onClick={handleModalSubmit}
                disabled={submitting}
                className="flex-1 bg-red-600 text-white py-2.5 rounded-xl font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {submitting ? "جاري الحذف..." : "نعم، احذف"}
              </button>
              <button 
                onClick={() => setModalType(null)}
                className="flex-1 bg-slate-100 text-slate-600 py-2.5 rounded-xl font-bold hover:bg-slate-200 transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">الاسم</label>
              <input 
                autoFocus
                type="text"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-900"
                placeholder="أدخل الاسم هنا..."
                value={modalInputValue}
                onChange={(e) => setModalInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleModalSubmit()}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button 
                onClick={handleModalSubmit}
                disabled={submitting || !modalInputValue.trim()}
                className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {submitting ? "جاري الحفظ..." : "حفظ التغييرات"}
              </button>
              <button 
                onClick={() => setModalType(null)}
                className="flex-1 bg-slate-100 text-slate-600 py-2.5 rounded-xl font-bold hover:bg-slate-200 transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* --- Error Toast --- */}
      {error && (
        <div className="fixed bottom-6 left-6 z-[200] bg-red-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-10 duration-300">
          <div className="bg-white/20 p-1 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
          </div>
          <span className="font-medium">{error}</span>
          <button onClick={() => setError(null)} className="text-white/60 hover:text-white ml-2">
             <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
      )}
    </div>
  );
}
