"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useTheme } from "next-themes";
import useSWR from "swr";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import type { PlanResponse, PlannerSection, PlannerTask } from "@/lib/types";
import { Modal } from "./ui/modal";

// --- Icons ---
const IconCheck = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600 dark:text-emerald-400">
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

const IconGrip = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/></svg>
);

const IconSun = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
);

const IconDarkMoon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
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

const fetcher = (url: string) => api<PlanResponse>(url);

// --- Components ---
function Skeleton() {
  return (
    <div className="animate-pulse space-y-8 p-4 max-w-6xl mx-auto">
      <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
      <div className="space-y-6">
        {[1, 2].map(i => (
          <div key={i} className="space-y-4">
            <div className="h-10 bg-slate-200 dark:bg-slate-800 w-1/4 rounded-xl" />
            <div className="h-64 bg-slate-100 dark:bg-slate-900 rounded-3xl" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="w-10 h-10" />;

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
      aria-label="Toggle Theme"
    >
      {theme === "dark" ? <IconSun /> : <IconDarkMoon />}
    </button>
  );
}

export function PlannerClient({ username }: { username: string }) {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState<number>(currentYear);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // SWR handles caching, revalidation, and deduplication
  const { data: plan, error: swrError, mutate, isLoading } = useSWR<PlanResponse>(
    `/api/plan?year=${year}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  );

  // --- Modal States ---
  const [modalType, setModalType] = useState<"add-section" | "edit-section" | "add-task" | "edit-task" | "delete-confirm" | "reset-confirm" | null>(null);
  const [modalData, setModalData] = useState<any>(null);
  const [modalInputValue, setModalInputValue] = useState("");

  // Sync checkins map whenever plan data changes
  const [checkins, setCheckins] = useState<Record<string, boolean>>({});
  useEffect(() => {
    if (plan) {
      const map: Record<string, boolean> = {};
      for (const checkin of plan.checkins) {
        map[checkinKey(checkin.taskId, checkin.dayNumber)] = checkin.done;
      }
      setCheckins(map);
    }
  }, [plan]);

  useEffect(() => {
    if (swrError) setError(swrError.message || "تعذر تحميل الخطة");
  }, [swrError]);

  const days = useMemo(() => {
    const count = plan?.dayCount ?? 30;
    return Array.from({ length: count }, (_, i) => i + 1);
  }, [plan?.dayCount]);

  const progress = plan?.progress ?? 0;

  // --- Drag and Drop Handlers ---
  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId, type } = result;

    if (!destination || !plan) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    if (type === "section") {
      const newSections = Array.from(plan.sections).sort((a, b) => a.order - b.order);
      const [removed] = newSections.splice(source.index, 1);
      newSections.splice(destination.index, 0, removed);

      const updatedSections = newSections.map((s, idx) => ({ ...s, order: idx + 1 }));
      mutate({ ...plan, sections: updatedSections }, false);

      try {
        await api("/api/sections/reorder", {
          method: "POST",
          body: JSON.stringify({ 
            planId: plan.planId, 
            sectionIds: updatedSections.map(s => s.id) 
          })
        });
        await mutate();
      } catch {
        setError("تعذر إعادة ترتيب الأقسام");
        await mutate();
      }
    } else {
      const sourceSectionId = source.droppableId;
      const destSectionId = destination.droppableId;
      
      const sourceSection = plan.sections.find(s => s.id === sourceSectionId);
      const destSection = plan.sections.find(s => s.id === destSectionId);
      if (!sourceSection || !destSection) return;

      const newSourceTasks = Array.from(sourceSection.tasks).sort((a, b) => a.order - b.order);
      const [movedTask] = newSourceTasks.splice(source.index, 1);

      if (sourceSectionId === destSectionId) {
        newSourceTasks.splice(destination.index, 0, movedTask);
        const updatedTasks = newSourceTasks.map((t, idx) => ({ ...t, order: idx + 1 }));
        
        const updatedSections = plan.sections.map(s => 
          s.id === sourceSectionId ? { ...s, tasks: updatedTasks } : s
        );
        mutate({ ...plan, sections: updatedSections }, false);

        try {
          await api("/api/tasks/reorder", {
            method: "POST",
            body: JSON.stringify({ 
              sectionId: sourceSectionId, 
              taskIds: updatedTasks.map(t => t.id) 
            })
          });
          await mutate();
        } catch {
          await mutate();
        }
      } else {
        const newDestTasks = Array.from(destSection.tasks).sort((a, b) => a.order - b.order);
        newDestTasks.splice(destination.index, 0, movedTask);

        const updatedSourceTasks = newSourceTasks.map((t, i) => ({ ...t, order: i + 1 }));
        const updatedDestTasks = newDestTasks.map((t, i) => ({ ...t, order: i + 1 }));

        const updatedSections = plan.sections.map(s => {
          if (s.id === sourceSectionId) return { ...s, tasks: updatedSourceTasks };
          if (s.id === destSectionId) return { ...s, tasks: updatedDestTasks };
          return s;
        });
        mutate({ ...plan, sections: updatedSections }, false);

        try {
          // Update both sections' tasks
          await Promise.all([
            api("/api/tasks/reorder", {
              method: "POST",
              body: JSON.stringify({ 
                sectionId: sourceSectionId, 
                taskIds: updatedSourceTasks.map(t => t.id) 
              })
            }),
            api("/api/tasks/reorder", {
              method: "POST",
              body: JSON.stringify({ 
                sectionId: destSectionId, 
                taskIds: updatedDestTasks.map(t => t.id) 
              })
            })
          ]);
          await mutate();
        } catch {
          await mutate();
        }
      }
    }
  };

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
      await mutate();
    } catch {
      setCheckins((prev) => ({ ...prev, [key]: !next }));
      setError("تعذر حفظ التغيير");
    }
  }

  const handleModalSubmit = async () => {
    if (!modalType) return;
    const value = modalInputValue.trim();
    if (!value && modalType !== "delete-confirm" && modalType !== "reset-confirm") return;

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
        await api("/api/checkins/reset", {
          method: "POST",
          body: JSON.stringify({ planId: plan.planId })
        });
      }

      setModalType(null);
      await mutate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setSubmitting(false);
    }
  };

  async function logout() {
    setSubmitting(true);
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("فشل تسجيل الخروج");

      // Clear sensitive data from memory (security)
      setCheckins({});
      setError(null);

      // Force full page reload to ensure cookie is cleared before next request
      window.location.href = "/login";
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر تسجيل الخروج");
      setSubmitting(false);
    }
  }

  const yearOptions = useMemo(() => {
    const years = [];
    for (let i = 0; i <= 5; i++) years.push(currentYear + i);
    return years;
  }, [currentYear]);

  if (isLoading) return <Skeleton />;
  if (!plan) return <div className="p-10 text-center dark:text-slate-400">لا توجد بيانات لهذه السنة</div>;

  return (
    <div className="min-h-screen pb-20 bg-slate-50 dark:bg-slate-950 transition-colors">
      <header className="bg-emerald-800 dark:bg-emerald-900 text-white py-6 shadow-lg no-print sticky top-0 z-50 transition-colors">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="bg-emerald-700 dark:bg-emerald-800 p-2.5 rounded-2xl shadow-inner">
                <IconMoon />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold font-amiri tracking-wide">رفيق المسلم</h1>
                <div className="flex items-center gap-2 mt-1 text-emerald-100/80">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-medium">مرحباً بك، {username}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 md:gap-3 items-center justify-center">
              <ThemeToggle />
              
              <div className="relative group">
                <select
                  className="appearance-none bg-emerald-900/50 border border-emerald-600 dark:border-emerald-700 text-white rounded-xl pl-10 pr-4 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all cursor-pointer"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                >
                  {yearOptions.map(y => (
                    <option key={y} value={y} className="text-slate-900 dark:bg-slate-900 dark:text-slate-100">{y} هـ / م</option>
                  ))}
                </select>
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-emerald-300">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                </div>
              </div>

              <div className="flex bg-emerald-900/40 p-1 rounded-xl border border-emerald-600/50">
                {[29, 30].map(d => (
                  <button
                    key={d}
                    onClick={() => { if(plan.dayCount !== d) api("/api/plan/settings", { method: "PATCH", body: JSON.stringify({ planId: plan.planId, dayCount: d }) }).then(() => mutate()); }}
                    className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${plan.dayCount === d ? "bg-amber-400 text-emerald-950 shadow-md" : "text-emerald-100 hover:bg-emerald-800/50"}`}
                  >
                    {d} يوم
                  </button>
                ))}
              </div>

              <button onClick={() => window.print()} className="bg-emerald-50 dark:bg-slate-800 text-emerald-800 dark:text-emerald-100 px-4 py-2 rounded-xl text-sm font-bold hover:bg-white dark:hover:bg-slate-700 transition-colors shadow-sm flex items-center gap-2">
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

              <button 
                onClick={logout} 
                disabled={submitting}
                className="bg-slate-800 dark:bg-slate-950 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                {submitting ? "جاري الخروج..." : "خروج"}
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

      <main className="container mx-auto px-4 mt-8 max-w-7xl">
        <div className="print-only text-center mb-10 border-b-4 border-emerald-800 pb-6 dark:text-emerald-100">
          <h1 className="text-4xl font-bold font-amiri text-emerald-900 dark:text-emerald-100">جدول متابعة رمضان {year}</h1>
          <p className="text-emerald-700 dark:text-emerald-300 mt-2 text-xl font-amiri">"وَفِي ذَلِكَ فَلْيَتَنَافَسِ الْمُتَنَافِسُونَ"</p>
        </div>

        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="sections" type="section">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-8">
                {plan.sections
                  .sort((a, b) => a.order - b.order)
                  .map((section, index) => (
                    <Draggable key={section.id} draggableId={section.id} index={index}>
                      {(provided, snapshot) => (
                        <section 
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-all ${snapshot.isDragging ? 'shadow-2xl ring-2 ring-emerald-500 scale-[1.01]' : 'hover:shadow-md'}`}
                        >
                          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-4 justify-between">
                            <div className="flex items-center gap-3">
                              <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing p-1">
                                <IconGrip />
                              </div>
                              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold">
                                {section.title.charAt(0)}
                              </div>
                              <h2 className="font-bold text-slate-800 dark:text-slate-100 text-lg">{section.title}</h2>
                            </div>
                            
                            <div className="no-print flex flex-wrap gap-2 items-center">
                              <button 
                                onClick={() => { setModalType("add-task"); setModalData({ sectionId: section.id }); setModalInputValue(""); }} 
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
                              >
                                <IconPlus /> مهمة جديدة
                              </button>
                              <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />
                              <button onClick={() => { setModalType("edit-section"); setModalData(section); setModalInputValue(section.title); }} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-200 transition-all" title="تعديل">
                                <IconEdit />
                              </button>
                              <button onClick={() => { setModalType("delete-confirm"); setModalData({ type: "section", id: section.id, title: section.title }); }} className="p-1.5 rounded-lg text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-all" title="حذف">
                                <IconTrash />
                              </button>
                            </div>
                          </div>

                          <Droppable droppableId={section.id} type="task">
                            {(provided) => (
                              <div {...provided.droppableProps} ref={provided.innerRef} className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                                <table className="w-full text-right border-collapse">
                                  <thead>
                                    <tr className="bg-slate-50/50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 text-xs uppercase tracking-tighter">
                                      <th className="p-4 min-w-[260px] sticky right-0 bg-slate-50 dark:bg-slate-900 border-l border-slate-100 dark:border-slate-800 z-10 text-right font-black">المهمة اليومية</th>
                                      {days.map((d) => (
                                        <th key={d} className="p-1 min-w-[36px] text-center border-l border-slate-50/50 dark:border-slate-800/50 font-bold">{d}</th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody className="text-sm">
                                    {section.tasks
                                      .sort((a, b) => a.order - b.order)
                                      .map((task, idx) => (
                                        <Draggable key={task.id} draggableId={task.id} index={idx}>
                                          {(provided, snapshot) => (
                                            <tr 
                                              ref={provided.innerRef}
                                              {...provided.draggableProps}
                                              className={`group border-b border-slate-50 dark:border-slate-800/50 transition-colors ${snapshot.isDragging ? 'bg-slate-100 dark:bg-slate-800' : 'hover:bg-slate-50/30 dark:hover:bg-slate-800/20'}`}
                                            >
                                              <td className="p-3 md:p-4 font-medium text-slate-700 dark:text-slate-300 sticky right-0 border-l border-slate-50 dark:border-slate-800 z-10 bg-inherit shadow-[4px_0_8px_-4px_rgba(0,0,0,0.05)]">
                                                <div className="flex justify-between items-center gap-4">
                                                  <div className="flex items-center gap-3">
                                                    <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing p-1 opacity-0 group-hover:opacity-100 transition-opacity no-print">
                                                      <IconGrip />
                                                    </div>
                                                    <span className="w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{idx + 1}</span>
                                                    <span className="text-slate-800 dark:text-slate-200 font-medium whitespace-nowrap">{task.title}</span>
                                                  </div>

                                                  <div className="no-print flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => { setModalType("edit-task"); setModalData(task); setModalInputValue(task.title); }} className="p-1.5 rounded-md text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-200 transition-all">
                                                      <IconEdit />
                                                    </button>
                                                    <select
                                                      className="mx-1 px-1 rounded bg-slate-100 dark:bg-slate-800 text-[10px] border-none focus:ring-1 focus:ring-emerald-400 cursor-pointer text-slate-600 dark:text-slate-300"
                                                      value={section.id}
                                                      onChange={(e) => {
                                                        const destId = e.target.value;
                                                        if(destId !== section.id) {
                                                          // Manual move if dropdown used
                                                          api(`/api/tasks/${task.id}`, { method: "PATCH", body: JSON.stringify({ sectionId: destId, order: 9999 }) }).then(() => mutate());
                                                        }
                                                      }}
                                                    >
                                                      {plan.sections.map((entry) => (
                                                        <option key={entry.id} value={entry.id}>{entry.title}</option>
                                                      ))}
                                                    </select>
                                                    <button onClick={() => { setModalType("delete-confirm"); setModalData({ type: "task", id: task.id, title: task.title }); }} className="p-1.5 rounded-md text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-all">
                                                      <IconTrash />
                                                    </button>
                                                  </div>
                                                </div>
                                              </td>

                                              {days.map((day) => {
                                                const done = checkins[checkinKey(task.id, day)] ?? false;
                                                return (
                                                  <td key={day} className="p-0 border-l border-slate-50 dark:border-slate-800/50 text-center relative h-12">
                                                    <div
                                                      onClick={() => toggleTask(task.id, day)}
                                                      className={`checkbox-wrapper w-full h-full flex items-center justify-center cursor-pointer select-none no-print transition-all duration-300 ${done ? "bg-emerald-50/50 dark:bg-emerald-900/10" : "hover:bg-slate-100/50 dark:hover:bg-slate-800/30"}`}
                                                    >
                                                      <div className={`w-6 h-6 rounded-md border-2 transition-all flex items-center justify-center ${done ? "bg-emerald-100 dark:bg-emerald-900/50 border-emerald-500 dark:border-emerald-400 scale-110 shadow-sm" : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"}`}>
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
                                          )}
                                        </Draggable>
                                      ))}
                                    {provided.placeholder}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </Droppable>
                        </section>
                      )}
                    </Draggable>
                  ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        <div className="mt-12 text-center text-slate-400 dark:text-slate-500 text-xs no-print flex flex-col items-center gap-2">
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
            <p className="text-slate-600 dark:text-slate-400">هل تريد تصفير المتابعة للسنة الحالية <span className="font-bold text-slate-900 dark:text-slate-100">{year}</span>؟</p>
            <p className="text-xs text-amber-600 dark:text-amber-400 font-bold">هذا الإجراء لا يمكن التراجع عنه.</p>
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
                className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 py-2.5 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        ) : modalType === "delete-confirm" ? (
          <div className="space-y-4">
            <p className="text-slate-600 dark:text-slate-400">هل أنت متأكد من حذف <span className="font-bold text-slate-900 dark:text-slate-100">{modalData?.title}</span>؟</p>
            {modalData?.type === "section" && <p className="text-xs text-red-500 dark:text-red-400 font-bold">سيتم حذف جميع المهام التابعة لهذا القسم أيضاً.</p>}
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
                className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 py-2.5 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">الاسم</label>
              <input 
                autoFocus
                type="text"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-900 dark:text-slate-100"
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
                className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 py-2.5 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
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
