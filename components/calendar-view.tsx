"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import type { ScheduledTask } from "@/lib/types";
import { formatTime12h } from "@/lib/date-utils";

interface CalendarViewProps {
  tasks: ScheduledTask[];
  onTaskClick: (taskId: string) => void;
  onTaskMove: (taskId: string, newTime: string) => void;
  onTaskResize: (taskId: string, newDuration: number) => void;
  onEmptySlotClick: (time: string) => void;
  onDeleteTask: (taskId: string) => void;
  onToggleCheck: (taskId: string) => void;
}

const HOUR_HEIGHT = 120; // Taller for better precision
const SLOT_INTERVAL = 5; // 5 minutes
const PIXELS_PER_MINUTE = HOUR_HEIGHT / 60;

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

export function CalendarView({
  tasks,
  onTaskMove,
  onTaskResize,
  onEmptySlotClick,
  onDeleteTask,
  onToggleCheck
}: CalendarViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentTimeMinutes, setCurrentTimeMinutes] = useState<number>(0);
  
  // Drag/Resize State
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [resizingId, setResizingId] = useState<string | null>(null);
  const [dragGrabOffset, setDragGrabOffset] = useState(0); // Offset from task top in minutes
  const [tempMinutes, setTempMinutes] = useState<number | null>(null);
  const [tempDuration, setTempDuration] = useState<number | null>(null);
  
  // Interaction Visuals
  const [hoverMinutes, setHoverMinutes] = useState<number | null>(null);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTimeMinutes(now.getHours() * 60 + now.getMinutes());
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      const scrollMinutes = currentTimeMinutes > 0 ? currentTimeMinutes : 4 * 60;
      const scrollPos = (scrollMinutes * PIXELS_PER_MINUTE) - (containerRef.current.clientHeight / 3);
      containerRef.current.scrollTop = Math.max(0, scrollPos);
    }
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top + containerRef.current.scrollTop;
    const currentMins = y / PIXELS_PER_MINUTE;
    
    setHoverMinutes(Math.round(currentMins / SLOT_INTERVAL) * SLOT_INTERVAL);

    if (draggingId) {
      const newStartMins = Math.max(0, Math.min(1440 - SLOT_INTERVAL, currentMins - dragGrabOffset));
      setTempMinutes(Math.round(newStartMins / SLOT_INTERVAL) * SLOT_INTERVAL);
    } else if (resizingId) {
      const task = tasks.find(t => t.id === resizingId);
      if (task) {
        const startMin = timeToMinutes(task.scheduledTime);
        const newDur = Math.max(5, currentMins - startMin);
        setTempDuration(Math.round(newDur / SLOT_INTERVAL) * SLOT_INTERVAL);
      }
    }
  };

  const handleMouseUp = () => {
    if (draggingId && tempMinutes !== null) {
      onTaskMove(draggingId, minutesToTime(tempMinutes));
    } else if (resizingId && tempDuration !== null) {
      onTaskResize(resizingId, tempDuration);
    }
    setDraggingId(null);
    setResizingId(null);
    setTempMinutes(null);
    setTempDuration(null);
  };

  const layoutTasks = useMemo(() => {
    const sorted = [...tasks].sort((a, b) => timeToMinutes(a.scheduledTime) - timeToMinutes(b.scheduledTime));
    const columns: ScheduledTask[][] = [];
    
    sorted.forEach(task => {
      const start = timeToMinutes(task.scheduledTime);
      let placed = false;
      for (const col of columns) {
        const last = col[col.length - 1];
        if (start >= (timeToMinutes(last.scheduledTime) + last.durationMinutes)) {
          col.push(task);
          placed = true;
          break;
        }
      }
      if (!placed) columns.push([task]);
    });

    return columns.flatMap((col, colIndex) => 
      col.map(task => ({
        task,
        left: `${(colIndex / columns.length) * 100}%`,
        width: `${100 / columns.length}%`
      }))
    );
  }, [tasks]);

  return (
    <div className="flex flex-col h-[750px] bg-white dark:bg-slate-950 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden font-sans">
      {/* Time Header */}
      <div className="flex items-center px-6 py-4 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 backdrop-blur-md z-30">
        <div className="w-20 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">الوقت</div>
        <div className="flex-1 flex justify-center gap-8">
            <span className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
               <div className="w-2 h-2 rounded-full bg-emerald-500" /> تم الإنجاز
            </span>
            <span className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
               <div className="w-2 h-2 rounded-full bg-amber-500" /> قيد التنفيذ
            </span>
        </div>
      </div>

      <div 
        ref={containerRef}
        className="relative flex-1 overflow-y-auto no-scrollbar"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div className="relative w-full" style={{ height: 24 * HOUR_HEIGHT }}>
          
          {/* Enhanced Grid */}
          {Array.from({ length: 24 }).map((_, h) => (
            <div 
              key={h} 
              className="absolute w-full border-t border-slate-100 dark:border-slate-800/40"
              style={{ top: h * HOUR_HEIGHT, height: HOUR_HEIGHT }}
            >
              <div className="absolute -top-3 left-4 text-[11px] font-black text-slate-300 dark:text-slate-600 tabular-nums">
                {formatTime12h(`${h.toString().padStart(2, '0')}:00`)}
              </div>
              {/* Quarter hour indicators */}
              {[15, 30, 45].map(m => (
                <div 
                  key={m}
                  className="absolute w-full border-t border-slate-50 dark:border-slate-800/10 border-dashed"
                  style={{ top: m * PIXELS_PER_MINUTE }}
                />
              ))}
            </div>
          ))}

          {/* Interaction Visuals */}
          {hoverMinutes !== null && (
             <div 
               className="absolute left-20 right-4 border-t-2 border-emerald-500/20 z-10 pointer-events-none"
               style={{ top: hoverMinutes * PIXELS_PER_MINUTE }}
             >
                <div className="absolute -top-2.5 -left-16 bg-slate-900 text-white text-[9px] font-bold px-2 py-1 rounded-full shadow-xl">
                  {formatTime12h(minutesToTime(hoverMinutes))}
                </div>
             </div>
          )}

          {/* Current Time Indicator */}
          <div 
            className="absolute left-20 right-0 border-t-2 border-red-500 z-40 pointer-events-none"
            style={{ top: currentTimeMinutes * PIXELS_PER_MINUTE }}
          >
            <div className="absolute -left-1.5 -top-1.5 w-3 h-3 bg-red-500 rounded-full shadow-[0_0_15px_rgba(239,68,68,0.6)]" />
          </div>

          {/* Interaction Surface */}
          <div 
            className="absolute top-0 left-20 right-0 h-full z-0 cursor-crosshair"
            onClick={(e) => {
              if (draggingId || resizingId) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const y = e.clientY - rect.top;
              const mins = Math.round((y / PIXELS_PER_MINUTE) / SLOT_INTERVAL) * SLOT_INTERVAL;
              onEmptySlotClick(minutesToTime(mins));
            }}
          />

          {/* Task Blocks */}
          <div className="absolute top-0 left-20 right-6 h-full pointer-events-none">
            {layoutTasks.map(({ task, left, width }) => {
              const isDragging = draggingId === task.id;
              const isResizing = resizingId === task.id;
              
              const startMins = isDragging && tempMinutes !== null ? tempMinutes : timeToMinutes(task.scheduledTime);
              const duration = isResizing && tempDuration !== null ? tempDuration : task.durationMinutes;
              
              const top = startMins * PIXELS_PER_MINUTE;
              const height = duration * PIXELS_PER_MINUTE;
              const isVeryShort = height < 45;

              return (
                <div
                  key={task.id}
                  className={`absolute rounded-2xl border transition-all pointer-events-auto overflow-visible flex flex-col ${
                    task.done 
                      ? "bg-emerald-50/90 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50" 
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm"
                  } ${isDragging ? "shadow-2xl z-50 ring-4 ring-emerald-500/20 cursor-grabbing scale-[1.02]" : "hover:shadow-md cursor-grab"}`}
                  style={{
                    top,
                    height: Math.max(20, height),
                    left: `calc(${left} + 4px)`,
                    width: `calc(${width} - 8px)`,
                    zIndex: isDragging ? 100 : 10
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    const target = e.target as HTMLElement;
                    if (target.closest('.resize-handle')) {
                      setResizingId(task.id);
                    } else {
                      setDraggingId(task.id);
                      const rect = e.currentTarget.getBoundingClientRect();
                      const clickYMinutes = (e.clientY - rect.top) / PIXELS_PER_MINUTE;
                      setDragGrabOffset(clickYMinutes);
                    }
                  }}
                >
                  {/* Status Accent */}
                  <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-full ${task.done ? "bg-emerald-500" : "bg-amber-500"}`} />

                  {/* Task Content */}
                  <div className={`flex-1 flex flex-col min-w-0 p-3 pl-4 ${isVeryShort ? "justify-center" : "justify-start"}`}>
                    <div className={`flex items-center justify-between gap-2 ${isVeryShort ? "absolute -top-6 left-0 bg-slate-800 text-white px-2 py-0.5 rounded-md shadow-lg" : "mb-1"}`}>
                      <span className="text-[9px] font-black tabular-nums opacity-60">
                        {formatTime12h(minutesToTime(startMins))}
                      </span>
                      {!isVeryShort && (
                         <button 
                            onMouseDown={e => e.stopPropagation()}
                            onClick={() => onToggleCheck(task.taskId)}
                            className={`w-4 h-4 rounded-md flex items-center justify-center border transition-colors ${task.done ? "bg-emerald-500 border-emerald-500 text-white" : "bg-white dark:bg-slate-800 border-slate-200"}`}
                         >
                            {task.done && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12" /></svg>}
                         </button>
                      )}
                    </div>

                    <h4 className={`font-bold leading-tight truncate ${isVeryShort ? "text-[10px]" : "text-xs"} ${task.done ? "text-slate-400 line-through" : "text-slate-800 dark:text-slate-100"}`}>
                       {task.title}
                    </h4>

                    {!isVeryShort && height > 65 && (
                      <span className="mt-1 text-[8px] font-black uppercase tracking-widest text-slate-400 truncate">
                        {task.sectionTitle}
                      </span>
                    )}
                  </div>

                  {/* Desktop Hover Actions */}
                  {!isDragging && (
                    <button 
                      onMouseDown={e => e.stopPropagation()}
                      onClick={() => onDeleteTask(task.id)}
                      className="absolute -top-2 -right-2 p-1.5 rounded-full bg-red-500 text-white shadow-lg opacity-0 group-hover:opacity-100 hover:scale-110 transition-all z-50"
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12" /></svg>
                    </button>
                  )}

                  {/* Resize Handle */}
                  <div className="resize-handle h-3 w-full cursor-ns-resize flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-8 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="px-8 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase tracking-widest">
         <span>اسحب المهمة للتحريك</span>
         <div className="flex gap-4">
            <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-amber-500" /> {tasks.filter(t => !t.done).length} مهام متبقية</span>
            <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {tasks.filter(t => t.done).length} مهام مكتملة</span>
         </div>
      </div>
    </div>
  );
}
