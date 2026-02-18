"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import useSWR from "swr";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import type { PlanResponse, PlannerSection, PlannerTask } from "@/lib/types";
import { Modal } from "./ui/modal";
import { SearchableSelect } from "./ui/searchable-select";
import { getRamadanDays } from "@/lib/date-utils";
import { CreateCategoryModal } from "./create-category-modal";
import { CreateTaskModal } from "./create-task-modal";
import { CalendarView } from "./calendar-view";

// --- Icons ---
const IconCheck = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-emerald-600 dark:text-emerald-400"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconMoon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="#fcd34d"
    stroke="#f59e0b"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
  </svg>
);

const IconTrash = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    <line x1="10" x2="10" y1="11" y2="17" />
    <line x1="14" x2="14" y1="11" y2="17" />
  </svg>
);

const IconEdit = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    <path d="m15 5 4 4" />
  </svg>
);

const IconPlus = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M5 12h14" />
    <path d="M12 5v14" />
  </svg>
);

const IconGrip = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-slate-400"
  >
    <circle cx="9" cy="5" r="1" />
    <circle cx="9" cy="12" r="1" />
    <circle cx="9" cy="19" r="1" />
    <circle cx="15" cy="5" r="1" />
    <circle cx="15" cy="12" r="1" />
    <circle cx="15" cy="19" r="1" />
  </svg>
);

const IconSun = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2" />
    <path d="M12 20v2" />
    <path d="m4.93 4.93 1.41 1.41" />
    <path d="m17.66 17.66 1.41 1.41" />
    <path d="M2 12h2" />
    <path d="M20 12h2" />
    <path d="m6.34 17.66-1.41 1.41" />
    <path d="m19.07 4.93-1.41 1.41" />
  </svg>
);

const IconDarkMoon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
  </svg>
);

const IconMenu = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="4" x2="20" y1="12" y2="12" />
    <line x1="4" x2="20" y1="6" y2="6" />
    <line x1="4" x2="20" y1="18" y2="18" />
  </svg>
);

const IconClose = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

const IconLogout = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" x2="9" y1="12" y2="12" />
  </svg>
);

const IconClock = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const IconList = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="8" x2="21" y1="6" y2="6" />
    <line x1="8" x2="21" y1="12" y2="12" />
    <line x1="8" x2="21" y1="18" y2="18" />
    <line x1="3" x2="3.01" y1="6" y2="6" />
    <line x1="3" x2="3.01" y1="12" y2="12" />
    <line x1="3" x2="3.01" y1="18" y2="18" />
  </svg>
);

const IconCalendar = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
    <line x1="16" x2="16" y1="2" y2="6" />
    <line x1="8" x2="8" y1="2" y2="6" />
    <line x1="3" x2="21" y1="10" y2="10" />
  </svg>
);

const IconSettings = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
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
      ...(init?.headers ?? {}),
    },
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
        {[1, 2].map((i) => (
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
  const router = useRouter();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState<number>(currentYear);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "info" | "loading";
    progress?: number;
  } | null>(null);
  const [syncProgress, setSyncProgress] = useState<number | null>(null);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"checklist" | "tracker">("tracker");
  const [trackerMode, setTrackerMode] = useState<"timeline" | "calendar">(
    "timeline",
  );
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [trackerModalOpen, setTrackerModalOpen] = useState(false);
  const [trackerForm, setTrackerForm] = useState<{
    taskId: string;
    sectionId: string;
    title: string;
    time: string;
    scheduleType: "once" | "daily" | "weekly" | "monthly";
    selectedDate: string;
    selectedDayOfWeek: number;
    duration: number;
    isRecurring: boolean;
  }>({
    taskId: "",
    sectionId: "",
    title: "",
    time: "00:00",
    scheduleType: "once",
    selectedDate: "",
    selectedDayOfWeek: 5, // Default Friday
    duration: 30,
    isRecurring: false,
  });

  const [addTaskForm, setAddTaskForm] = useState<{
    title: string;
    isScheduled: boolean;
    scheduleType: "once" | "daily" | "weekly";
    time: string;
    duration: number;
    selectedDayOfWeek: number;
    selectedDate: string;
  }>({
    title: "",
    isScheduled: false,
    scheduleType: "daily",
    time: "10:00",
    duration: 30,
    selectedDayOfWeek: 5,
    selectedDate: "",
  });

  const [locationForm, setLocationForm] = useState({
    city: "",
    country: "",
    method: 2,
  });

  const [countries, setCountries] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [loadingGeo, setLoadingGeo] = useState({
    countries: false,
    cities: false,
  });
  const [geoError, setGeoError] = useState<{
    countries?: string;
    cities?: string;
  }>({});

  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);

  // Cache for fetched data (from API only – no static lists in code)
  const countriesCacheRef = useRef<{
    arabic: string[];
    english: Record<string, string>;
  } | null>(null);
  const citiesCacheRef = useRef<
    Record<string, { arabic: string[]; english: Record<string, string> }>
  >({});

  // Initialize AOS (Animate On Scroll) once on mount
  useEffect(() => {
    AOS.init({
      duration: 600,
      easing: "ease-out-cubic",
      once: false,
      offset: 40,
    });
  }, []);

  // Fetch countries in Arabic from our API (which uses restcountries)
  useEffect(() => {
    async function fetchCountries() {
      if (countriesCacheRef.current) {
        setCountries(countriesCacheRef.current.arabic);
        return;
      }

      setLoadingGeo((prev) => ({ ...prev, countries: true }));
      setGeoError((prev) => ({ ...prev, countries: undefined }));

      try {
        const res = await fetch("/api/geo/countries");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "فشل تحميل قائمة الدول");

        countriesCacheRef.current = {
          arabic: data.arabic,
          english: data.english,
        };
        setCountries(data.arabic);
        setGeoError((prev) => ({ ...prev, countries: undefined }));
      } catch (err) {
        const errorMsg =
          err instanceof Error
            ? err.message
            : "حدث خطأ أثناء تحميل قائمة الدول";
        setGeoError((prev) => ({ ...prev, countries: errorMsg }));
      } finally {
        setLoadingGeo((prev) => ({ ...prev, countries: false }));
      }
    }
    fetchCountries();
  }, []);

  // Fetch cities in Arabic from our API (by country; API uses CountriesNow + Arabic map)
  useEffect(() => {
    async function fetchCities() {
      if (!locationForm.country) {
        setCities([]);
        return;
      }

      const englishCountryName =
        countriesCacheRef.current?.english[locationForm.country] ??
        locationForm.country;

      if (citiesCacheRef.current[englishCountryName]) {
        setCities(citiesCacheRef.current[englishCountryName].arabic);
        return;
      }

      setLoadingGeo((prev) => ({ ...prev, cities: true }));
      setGeoError((prev) => ({ ...prev, cities: undefined }));

      try {
        const res = await fetch(
          `/api/geo/cities?country=${encodeURIComponent(englishCountryName)}`,
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "فشل تحميل قائمة المدن");

        citiesCacheRef.current[englishCountryName] = {
          arabic: data.arabic,
          english: data.english,
        };
        setCities(data.arabic);
        setGeoError((prev) => ({ ...prev, cities: undefined }));
      } catch (err) {
        const errorMsg =
          err instanceof Error
            ? err.message
            : "حدث خطأ أثناء تحميل قائمة المدن";
        setGeoError((prev) => ({ ...prev, cities: errorMsg }));
        setCities([]);
      } finally {
        setLoadingGeo((prev) => ({ ...prev, cities: false }));
      }
    }
    fetchCities();
  }, [locationForm.country]);

  // SWR handles caching, revalidation, and deduplication
  const {
    data: plan,
    error: swrError,
    mutate,
    isLoading,
  } = useSWR<PlanResponse>(`/api/plan?year=${year}`, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5000,
  });

  const ramadanDays = useMemo(() => {
    return getRamadanDays(year, plan?.ramadanOffset ?? 0).slice(
      0,
      plan?.dayCount ?? 30,
    );
  }, [year, plan?.dayCount, plan?.ramadanOffset]);

  // Sync location form with plan data
  useEffect(() => {
    if (plan && plan.locationCountry) {
      // Convert English country name to Arabic if we have it cached
      let countryDisplay = plan.locationCountry;
      if (countriesCacheRef.current) {
        const arabicEntry = Object.entries(
          countriesCacheRef.current.english,
        ).find(([, eng]) => eng === plan.locationCountry);
        if (arabicEntry) {
          countryDisplay = arabicEntry[0];
        }
      }

      // Convert English city name to Arabic from API cache
      let cityDisplay = plan.locationCity || "";
      if (cityDisplay && plan.locationCountry && plan.locationCity) {
        const englishCountryName =
          countriesCacheRef.current?.english[countryDisplay] ||
          plan.locationCountry;
        const cached = citiesCacheRef.current[englishCountryName];
        if (cached) {
          const arabicCityEntry = Object.entries(cached.english).find(
            ([, eng]) => eng === plan.locationCity,
          );
          if (arabicCityEntry) cityDisplay = arabicCityEntry[0];
        }
      }

      setLocationForm({
        city: plan.locationCity || "", // Store English name internally
        country: countryDisplay, // Store Arabic display name
        method: plan.calculationMethod || 2,
      });
    } else if (plan) {
      setLocationForm({
        city: "",
        country: "",
        method: plan.calculationMethod || 2,
      });
    }
  }, [plan]);

  // Handle client-side detection of screen size to avoid hydration mismatch
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Set initial active section on mobile
  useEffect(() => {
    if (plan?.sections?.length && !activeSectionId) {
      const firstSection = [...plan.sections].sort(
        (a, b) => a.order - b.order,
      )[0];
      setActiveSectionId(firstSection.id);
    }
  }, [plan, activeSectionId]);

  // --- Modal States ---
  const [modalType, setModalType] = useState<
    | "add-section"
    | "edit-section"
    | "add-task"
    | "edit-task"
    | "delete-confirm"
    | "reset-confirm"
    | "plan-settings"
    | null
  >(null);
  const [modalData, setModalData] = useState<any>(null);
  const [modalInputValue, setModalInputValue] = useState("");
  const [modalSectionValue, setModalSectionValue] = useState("");

  // New Modals State
  const [isCreateCategoryOpen, setIsCreateCategoryOpen] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);

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

  const getSectionProgress = useCallback(
    (section: PlannerSection) => {
      if (!section.tasks.length) return 0;
      let completed = 0;
      for (const task of section.tasks) {
        for (const day of days) {
          if (checkins[checkinKey(task.id, day)]) completed++;
        }
      }
      const total = section.tasks.length * days.length;
      return Math.round((completed / total) * 100);
    },
    [checkins, days],
  );

  // --- Drag and Drop Handlers ---
  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId, type } = result;

    if (!destination || !plan) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )
      return;

    if (type === "section") {
      const newSections = Array.from(plan.sections).sort(
        (a, b) => a.order - b.order,
      );
      const [removed] = newSections.splice(source.index, 1);
      newSections.splice(destination.index, 0, removed);

      const updatedSections = newSections.map((s, idx) => ({
        ...s,
        order: idx + 1,
      }));
      mutate({ ...plan, sections: updatedSections }, false);

      try {
        await api("/api/sections/reorder", {
          method: "POST",
          body: JSON.stringify({
            planId: plan.planId,
            sectionIds: updatedSections.map((s) => s.id),
          }),
        });
        await mutate();
      } catch {
        setError("تعذر إعادة ترتيب الأقسام");
        await mutate();
      }
    } else {
      const sourceSectionId = source.droppableId;
      const destSectionId = destination.droppableId;

      const sourceSection = plan.sections.find((s) => s.id === sourceSectionId);
      const destSection = plan.sections.find((s) => s.id === destSectionId);
      if (!sourceSection || !destSection) return;

      const newSourceTasks = Array.from(sourceSection.tasks).sort(
        (a, b) => a.order - b.order,
      );
      const [movedTask] = newSourceTasks.splice(source.index, 1);

      if (sourceSectionId === destSectionId) {
        newSourceTasks.splice(destination.index, 0, movedTask);
        const updatedTasks = newSourceTasks.map((t, idx) => ({
          ...t,
          order: idx + 1,
        }));

        const updatedSections = plan.sections.map((s) =>
          s.id === sourceSectionId ? { ...s, tasks: updatedTasks } : s,
        );
        mutate({ ...plan, sections: updatedSections }, false);

        try {
          await api("/api/tasks/reorder", {
            method: "POST",
            body: JSON.stringify({
              sectionId: sourceSectionId,
              taskIds: updatedTasks.map((t) => t.id),
            }),
          });
          await mutate();
        } catch {
          await mutate();
        }
      } else {
        const newDestTasks = Array.from(destSection.tasks).sort(
          (a, b) => a.order - b.order,
        );
        newDestTasks.splice(destination.index, 0, movedTask);

        const updatedSourceTasks = newSourceTasks.map((t, i) => ({
          ...t,
          order: i + 1,
        }));
        const updatedDestTasks = newDestTasks.map((t, i) => ({
          ...t,
          order: i + 1,
        }));

        const updatedSections = plan.sections.map((s) => {
          if (s.id === sourceSectionId)
            return { ...s, tasks: updatedSourceTasks };
          if (s.id === destSectionId) return { ...s, tasks: updatedDestTasks };
          return s;
        });
        mutate({ ...plan, sections: updatedSections }, false);

        try {
          await Promise.all([
            api("/api/tasks/reorder", {
              method: "POST",
              body: JSON.stringify({
                sectionId: sourceSectionId,
                taskIds: updatedSourceTasks.map((t) => t.id),
              }),
            }),
            api("/api/tasks/reorder", {
              method: "POST",
              body: JSON.stringify({
                sectionId: destSectionId,
                taskIds: updatedDestTasks.map((t) => t.id),
              }),
            }),
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
        body: JSON.stringify({ taskId, dayNumber: day, done: next }),
      });
      if (plan) {
        const exists = plan.checkins.some(
          (c) => c.taskId === taskId && c.dayNumber === day,
        );
        const newCheckins = exists
          ? plan.checkins.map((c) =>
            c.taskId === taskId && c.dayNumber === day
              ? { ...c, done: next }
              : c,
          )
          : [...plan.checkins, { taskId, dayNumber: day, done: next }];
        mutate({ ...plan, checkins: newCheckins }, false);
      }
    } catch {
      setCheckins((prev) => ({ ...prev, [key]: !next }));
      if (plan) mutate(plan, false);
      setError("تعذر حفظ التغيير");
    }
  }

  async function handleRecurringSubmit() {
    if (!plan) return;
    setSyncProgress(0);
    setSubmitting(true);

    try {
      const res = await fetch("/api/tasks/schedule-recurring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan.planId,
          year,
          taskId: trackerForm.taskId || undefined,
          sectionId: trackerForm.sectionId,
          title: trackerForm.title,
          scheduleType: trackerForm.scheduleType,
          selectedDate: trackerForm.selectedDate || selectedDay,
          selectedDayOfWeek: Number(trackerForm.selectedDayOfWeek),
          time: trackerForm.time,
          duration: trackerForm.duration
        })
      });

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunks = decoder.decode(value).split("\n\n");
        for (const chunk of chunks) {
          if (!chunk.startsWith("data: ")) continue;

          try {
            const event = JSON.parse(chunk.slice(6));

            if (event.step && event.total) {
              setSyncProgress(Math.round((event.step / event.total) * 100));
            }

            if (event.error) {
              setNotification({ message: event.error, type: "info" });
              throw new Error(event.error);
            }

            if (event.done) {
              setSyncProgress(100);
              setNotification({
                message: `تمت جدولة ${event.count} مهمة بنجاح`,
                type: "success"
              });

              setTrackerModalOpen(false);
              setTrackerForm({
                taskId: "",
                sectionId: "",
                title: "",
                time: "00:00",
                scheduleType: "once",
                selectedDate: "",
                selectedDayOfWeek: 5,
                duration: 30,
                isRecurring: false
              });
              await mutate();
              setTimeout(() => setNotification(null), 3000);
              return;
            }
          } catch (e) {
            console.error("Parse error", e);
          }
        }
      }
    } catch (err: any) {
      console.error("Scheduling error:", err);
      setError(err.message || "فشل في جدولة المهام");
    } finally {
      setSubmitting(false);
      setSyncProgress(null);
    }
  }

  async function handleTrackerSubmit() {
    if (!trackerForm.time) return;
    if (!trackerForm.taskId && (!trackerForm.sectionId || !trackerForm.title))
      return;

    // Use new recurring logic if needed
    if (trackerForm.isRecurring || trackerForm.scheduleType !== "once") {
      await handleRecurringSubmit();
      return;
    }

    setSubmitting(true);
    try {
      await api("/api/daily-tracker", {
        method: "POST",
        body: JSON.stringify({
          ...trackerForm,
          dayNumber: selectedDay,
          duration: trackerForm.duration || 30,
        }),
      });
      setTrackerModalOpen(false);
      setTrackerForm({
        taskId: "",
        sectionId: "",
        title: "",
        time: "00:00",
        scheduleType: "once",
        selectedDate: "",
        selectedDayOfWeek: 5,
        duration: 30,
        isRecurring: false
      });
      await mutate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر حفظ المهمة");
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteScheduled(id: string) {
    try {
      await api(`/api/daily-tracker?id=${id}`, { method: "DELETE" });
      await mutate();
    } catch (err) {
      setError("تعذر حذف المهمة من الجدول");
    }
  }

  async function handleTaskMove(id: string, newTime: string) {
    // Optimistic Update
    const oldTask = plan?.scheduledTasks.find((t) => t.id === id);
    if (!oldTask || !plan) return;

    const newTasks = plan.scheduledTasks.map((t) =>
      t.id === id ? { ...t, scheduledTime: newTime } : t,
    );
    mutate({ ...plan, scheduledTasks: newTasks }, false);

    try {
      await api("/api/daily-tracker", {
        method: "PATCH",
        body: JSON.stringify({ id, time: newTime }),
      });
      await mutate();
    } catch {
      mutate();
      setError("تعذر تحديث وقت المهمة");
    }
  }

  async function handleTaskResize(id: string, newDuration: number) {
    // Optimistic Update
    const oldTask = plan?.scheduledTasks.find((t) => t.id === id);
    if (!oldTask || !plan) return;

    const newTasks = plan.scheduledTasks.map((t) =>
      t.id === id ? { ...t, durationMinutes: newDuration } : t,
    );
    mutate({ ...plan, scheduledTasks: newTasks }, false);

    try {
      await api("/api/daily-tracker", {
        method: "PATCH",
        body: JSON.stringify({ id, duration: newDuration }),
      });
      await mutate();
    } catch {
      mutate();
      setError("تعذر تحديث مدة المهمة");
    }
  }

  async function handleLocationUpdate() {
    if (!plan || !locationForm.city || !locationForm.country) return;
    setSubmitting(true);
    try {
      const englishCountryName =
        countriesCacheRef.current?.english[locationForm.country] ||
        locationForm.country;

      await api("/api/plan/settings", {
        method: "PATCH",
        body: JSON.stringify({
          planId: plan.planId,
          locationCity: locationForm.city,
          locationCountry: englishCountryName,
          calculationMethod: locationForm.method,
        }),
      });
      await mutate();
      setNotification({ message: "تم حفظ الموقع بنجاح", type: "success" });

      // Automatically trigger prayer sync in background
      syncPrayers();
    } catch (err) {
      setError("تعذر تحديث بيانات الموقع");
    } finally {
      setSubmitting(false);
    }
  }

  async function syncPrayers() {
    if (!plan || (!locationForm.city && !plan.locationCity)) return;

    setSyncProgress(0);
    setNotification(null);

    try {
      const res = await fetch("/api/plan/sync-prayers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan.planId, year }),
      });

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const lines = decoder
          .decode(value)
          .split("\n")
          .filter((l) => l.startsWith("data: "));
        for (const line of lines) {
          const event = JSON.parse(line.slice(6));
          if (event.step && event.total) {
            setSyncProgress(Math.round((event.step / event.total) * 100));
          }
          if (event.done) {
            setSyncProgress(100);
            await mutate();
            setNotification({
              message: `تمت مزامنة ${event.syncedCount} موعد صلاة بنجاح`,
              type: "success",
            });
            setTimeout(
              () =>
                setNotification((prev) =>
                  prev?.type === "success" ? null : prev,
                ),
              5000,
            );
          }
          if (event.error) {
            setNotification({ message: event.error, type: "info" });
          }
        }
      }
    } catch (err) {
      console.error("Sync error:", err);
      setNotification({ message: "فشل مزامنة أوقات الصلاة", type: "info" });
    } finally {
      setSyncProgress(null);
    }
  }

  const handleModalSubmit = async () => {
    if (!modalType) return;

    // For Add Task, use the specialized form (unless it's simple mode, but let's unify handling)
    if (modalType === "add-task") {
      await handleAddTaskSubmit();
      return;
    }

    const value = modalInputValue.trim();
    if (
      !value &&
      modalType !== "delete-confirm" &&
      modalType !== "reset-confirm"
    )
      return;

    setSubmitting(true);
    try {
      if (modalType === "add-section" && plan) {
        await api("/api/sections", {
          method: "POST",
          body: JSON.stringify({ planId: plan.planId, title: value }),
        });
      } else if (modalType === "edit-section") {
        await api(`/api/sections/${modalData.id}`, {
          method: "PATCH",
          body: JSON.stringify({ title: value }),
        });
      } else if (modalType === "edit-task") {
        await api(`/api/tasks/${modalData.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            title: value,
            sectionId: modalSectionValue,
          }),
        });
      } else if (modalType === "delete-confirm") {
        const url =
          modalData.type === "section"
            ? `/api/sections/${modalData.id}`
            : `/api/tasks/${modalData.id}`;
        await api(url, { method: "DELETE" });
      } else if (modalType === "reset-confirm" && plan) {
        await api("/api/checkins/reset", {
          method: "POST",
          body: JSON.stringify({ planId: plan.planId }),
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

  async function handleAddTaskSubmit() {
    if (!addTaskForm.title.trim()) return;
    if (!plan) return;

    setSubmitting(true);
    setSyncProgress(null);

    // If NOT scheduled, use simple API
    if (!addTaskForm.isScheduled) {
      try {
        await api("/api/tasks", {
          method: "POST",
          body: JSON.stringify({
            sectionId: modalData.sectionId,
            title: addTaskForm.title,
          }),
        });
        setModalType(null);
        setAddTaskForm(prev => ({ ...prev, title: "" }));
        await mutate();
      } catch (err) {
        setError(err instanceof Error ? err.message : "حدث خطأ أثناء إضافة المهمة");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // If Scheduled, use Recurring/SSE API
    setSyncProgress(0);
    try {
      const res = await fetch("/api/tasks/schedule-recurring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan.planId,
          year,
          sectionId: modalData.sectionId,
          title: addTaskForm.title,
          scheduleType: addTaskForm.scheduleType,
          selectedDate: addTaskForm.selectedDate || selectedDay, // Default to selectedDay if 'once' and not specified
          selectedDayOfWeek: Number(addTaskForm.selectedDayOfWeek),
          time: addTaskForm.time,
          duration: addTaskForm.duration
        })
      });

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunks = decoder.decode(value).split("\n\n");
        for (const chunk of chunks) {
          if (!chunk.startsWith("data: ")) continue;
          const event = JSON.parse(chunk.slice(6));

          if (event.step && event.total) {
            setSyncProgress(Math.round((event.step / event.total) * 100));
          }
          if (event.error) throw new Error(event.error);

          if (event.done) {
            setSyncProgress(100);
            setNotification({
              message: `تمت إضافة وجدولة المهمة بنجاح`,
              type: "success"
            });
            setModalType(null);
            setAddTaskForm(prev => ({ ...prev, title: "" }));
            await mutate();
            setTimeout(() => setNotification(null), 3000);
            return;
          }
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "حدث خطأ أثناء جدولة المهمة");
    } finally {
      setSubmitting(false);
      setSyncProgress(null);
    }
  }

  async function logout() {
    setSubmitting(true);
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("فشل تسجيل الخروج");
      router.push("/login");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر تسجيل الخروج");
      setSubmitting(false);
    }
  }

  const handleDayCountChange = useCallback(
    async (d: 29 | 30) => {
      if (!plan || plan.dayCount === d) return;
      const previousDayCount = plan.dayCount;
      // Optimistic update
      mutate({ ...plan, dayCount: d }, false);
      try {
        await api("/api/plan/settings", {
          method: "PATCH",
          body: JSON.stringify({ planId: plan.planId, dayCount: d }),
        });
        await mutate();
      } catch {
        // Rollback on failure
        mutate({ ...plan, dayCount: previousDayCount }, false);
        setError("تعذر تغيير عدد الأيام");
      }
    },
    [plan, mutate],
  );

  const handleOffsetChange = useCallback(
    async (offset: number) => {
      if (!plan || plan.ramadanOffset === offset) return;
      const previousOffset = plan.ramadanOffset;
      // Optimistic update
      mutate({ ...plan, ramadanOffset: offset }, false);
      try {
        await api("/api/plan/settings", {
          method: "PATCH",
          body: JSON.stringify({ planId: plan.planId, ramadanOffset: offset }),
        });
        await mutate();
      } catch {
        mutate({ ...plan, ramadanOffset: previousOffset }, false);
        setError("تعذر تغيير إزاحة التاريخ");
      }
    },
    [plan, mutate],
  );

  const yearOptions = useMemo(() => {
    const years = [];
    for (let i = 0; i <= 5; i++) years.push(currentYear + i);
    return years;
  }, [currentYear]);

  const renderTaskView = (section: PlannerSection) => {
    if (isMobile) {
      return (
        <Droppable droppableId={section.id} type="task">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-4 p-2"
            >
              {section.tasks
                .sort((a, b) => a.order - b.order)
                .map((task, idx) => (
                  <Draggable key={task.id} draggableId={task.id} index={idx}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm transition-all ${snapshot.isDragging ? "shadow-xl scale-[1.02] ring-2 ring-emerald-500" : ""}`}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            <div {...provided.dragHandleProps} className="p-1">
                              <IconGrip />
                            </div>
                            <div>
                              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm leading-tight">
                                {task.title}
                              </h3>
                              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                                المهمة رقم {idx + 1}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => {
                                setModalType("edit-task");
                                setModalData(task);
                                setModalInputValue(task.title);
                                setModalSectionValue(section.id);
                              }}
                              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500"
                            >
                              <IconEdit />
                            </button>
                            <button
                              onClick={() => {
                                setModalType("delete-confirm");
                                setModalData({
                                  type: "task",
                                  id: task.id,
                                  title: task.title,
                                });
                              }}
                              className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500"
                            >
                              <IconTrash />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-6 gap-2">
                          {ramadanDays.map((d) => {
                            const day = d.dayNumber;
                            const done =
                              checkins[checkinKey(task.id, day)] ?? false;
                            return (
                              <div
                                key={day}
                                onClick={() => toggleTask(task.id, day)}
                                className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl border-2 transition-all cursor-pointer select-none active:scale-90 relative overflow-hidden ${done
                                  ? "bg-emerald-500 border-emerald-600 shadow-[0_4px_12px_-2px_rgba(16,185,129,0.4)]"
                                  : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-emerald-200"
                                  }`}
                              >
                                <span
                                  className={`text-[11px] font-black leading-none ${done ? "text-white" : "text-slate-900 dark:text-slate-100"}`}
                                >
                                  {day}
                                </span>
                                <span
                                  className={`text-[7px] font-bold mt-1 leading-none ${done ? "text-emerald-50/80" : "text-slate-400"}`}
                                >
                                  {d.formattedGregorian}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      );
    }

    return (
      <Droppable droppableId={section.id} type="task">
        {(provided) => (
          <div className="hidden md:block overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
            <table
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="w-full text-right border-collapse"
              style={{ minWidth: `${260 + ramadanDays.length * 48}px` }}
            >
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 text-xs uppercase tracking-tighter">
                  <th className="p-4 min-w-[260px] sticky right-0 bg-slate-50 dark:bg-slate-900 border-l border-slate-100 dark:border-slate-800 z-10 text-right font-black shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)] dark:shadow-[4px_0_12px_-2px_rgba(0,0,0,0.5)]">
                    المهمة اليومية
                  </th>
                  {ramadanDays.map((d) => (
                    <th
                      key={d.dayNumber}
                      className="p-2 min-w-[48px] text-center border-l border-slate-50/50 dark:border-slate-800/50 font-bold"
                    >
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-[12px] text-slate-900 dark:text-slate-100 font-black leading-none">
                          {d.dayNumber}
                        </span>
                        <div className="h-px w-4 bg-slate-200 dark:bg-slate-700 my-0.5" />
                        <span className="text-[8px] text-slate-400 dark:text-slate-500 font-bold whitespace-nowrap leading-none">
                          {d.formattedGregorian}
                        </span>
                      </div>
                    </th>
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
                          className={`group border-b border-slate-50 dark:border-slate-800/50 transition-colors ${snapshot.isDragging
                            ? "bg-slate-100 dark:bg-slate-800 shadow-xl !flex md:!table w-full"
                            : "hover:bg-slate-50/30 dark:hover:bg-slate-800/20"
                            }`}
                          style={provided.draggableProps.style}
                        >
                          <td
                            className={`p-3 md:p-4 font-medium text-slate-700 dark:text-slate-300 sticky right-0 border-l border-slate-50 dark:border-slate-800 z-10 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)] dark:shadow-[4px_0_12px_-2px_rgba(0,0,0,0.5)] ${snapshot.isDragging
                              ? "bg-slate-100 dark:bg-slate-800"
                              : "bg-white dark:bg-slate-900"
                              }`}
                          >
                            <div className="flex justify-between items-center gap-4">
                              <div className="flex items-center gap-3">
                                <div
                                  {...provided.dragHandleProps}
                                  className="cursor-grab active:cursor-grabbing p-1 opacity-0 group-hover:opacity-100 transition-opacity no-print"
                                >
                                  <IconGrip />
                                </div>
                                <span className="w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                  {idx + 1}
                                </span>
                                <span className="text-slate-800 dark:text-slate-200 font-medium whitespace-nowrap">
                                  {task.title}
                                </span>
                              </div>

                              <div className="no-print flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => {
                                    setModalType("edit-task");
                                    setModalData(task);
                                    setModalInputValue(task.title);
                                    setModalSectionValue(section.id);
                                  }}
                                  className="p-1.5 rounded-md text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-200 transition-all"
                                >
                                  <IconEdit />
                                </button>

                                <button
                                  onClick={() => {
                                    setModalType("delete-confirm");
                                    setModalData({
                                      type: "task",
                                      id: task.id,
                                      title: task.title,
                                    });
                                  }}
                                  className="p-1.5 rounded-md text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-all"
                                >
                                  <IconTrash />
                                </button>
                              </div>
                            </div>
                          </td>

                          {days.map((day) => {
                            const done =
                              checkins[checkinKey(task.id, day)] ?? false;
                            return (
                              <td
                                key={day}
                                className="p-0 border-l border-slate-50 dark:border-slate-800/50 text-center relative h-12 text-slate-900 dark:text-slate-100"
                              >
                                <div
                                  onClick={() => toggleTask(task.id, day)}
                                  className={`checkbox-wrapper w-full h-full flex items-center justify-center cursor-pointer select-none no-print transition-all duration-300 ${done ? "bg-emerald-50/50 dark:bg-emerald-900/10" : "hover:bg-slate-100/50 dark:hover:bg-slate-800/30"}`}
                                >
                                  <div
                                    className={`w-6 h-6 rounded-md border-2 transition-all flex items-center justify-center ${done ? "bg-emerald-100 dark:bg-emerald-900/50 border-emerald-500 dark:border-emerald-400 scale-110 shadow-sm" : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"}`}
                                  >
                                    {done ? <IconCheck /> : null}
                                  </div>
                                </div>
                                <div className="print-only w-full h-full border-l border-slate-300 flex items-center justify-center">
                                  {done ? (
                                    <div className="w-3 h-3 bg-slate-800 rounded-sm" />
                                  ) : null}
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
    );
  };

  if (isLoading) return <Skeleton />;
  if (!plan)
    return (
      <div className="p-10 text-center dark:text-slate-400">
        لا توجد بيانات لهذه السنة
      </div>
    );

  return (
    <div className="min-h-screen pb-20 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <header
        className="bg-emerald-800 dark:bg-emerald-900 text-white py-4 shadow-lg no-print sticky top-0 z-50 transition-all duration-300 ease-out"
        data-aos="fade-down"
      >
        <div className="container mx-auto px-4 transition-all duration-300">
          {/* Main Navbar */}
          <div className="flex w-full items-start justify-between transition-all duration-300">
            {/* Right Zone (Logo + Welcome) */}
            <div className="right-section flex flex-col items-end text-right">
              <div className="logo-wrapper flex flex-row items-center gap-2">
                <div className="bg-emerald-700 dark:bg-emerald-800 p-2.5 rounded-2xl shadow-inner transition-colors duration-300">
                  <IconMoon />
                </div>
                <div>
                  <h1 className="text-xl md:text-3xl font-bold font-amiri tracking-wide transition-colors duration-300">
                    رفيق رمضان
                  </h1>
                  <p className="welcome-text text-xs text-emerald-200/80">
                    مرحباً، {username}
                  </p>
                </div>
              </div>
            </div>

            {/* Center Zone (Tabs) */}
            <div className="hidden lg:flex flex-grow justify-center items-center gap-4">
              <div className="flex bg-emerald-900/40 p-1 rounded-xl border border-emerald-600/50 transition-all duration-300">
                <button
                  onClick={() => setViewMode("tracker")}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-300 ease-out flex items-center gap-2 ${viewMode === "tracker"
                    ? "bg-amber-400 text-emerald-950 shadow-md"
                    : "text-emerald-100 hover:bg-emerald-800/50"
                    }`}
                >
                  <IconCalendar /> المتابع اليومي
                </button>
                <button
                  onClick={() => setViewMode("checklist")}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-300 ease-out flex items-center gap-2 ${viewMode === "checklist"
                    ? "bg-amber-400 text-emerald-950 shadow-md"
                    : "text-emerald-100 hover:bg-emerald-800/50"
                    }`}
                >
                  <IconList /> الجدول العام
                </button>
              </div>
            </div>


            {/* Left Zone (Controls) */}
            <div className="hidden lg:flex items-center gap-2">
              <ThemeToggle />
              <button
                onClick={() => setModalType("plan-settings")}
                className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-300 ease-out"
                title="الإعدادات"
              >
                <IconSettings />
              </button>
              <button
                onClick={logout}
                disabled={submitting}
                className="logout-button p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-300 ease-out disabled:opacity-50"
                title="تسجيل الخروج"
              >
                {submitting ? "..." : <IconLogout />}
              </button>
            </div>

            {/* Mobile Burger Menu */}
            <div className="lg:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-xl bg-emerald-700 dark:bg-emerald-800 text-white hover:bg-emerald-600 transition-all duration-300 ease-out"
                aria-label="Toggle Menu"
              >
                {isMenuOpen ? <IconClose /> : <IconMenu />}
              </button>
            </div>
          </div>

          {/* Mobile Dropdown Menu */}
          {isMenuOpen && (
            <div className="lg:hidden mt-4 pt-4 border-t border-emerald-700/50 flex flex-col gap-4 animate-in slide-in-from-top-2 duration-300">
              <div className="flex items-center justify-between bg-emerald-900/20 p-3 rounded-2xl">
                <span className="text-sm font-bold text-emerald-50">
                  المظهر الداكن
                </span>
                <ThemeToggle />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    setModalType("plan-settings");
                    setIsMenuOpen(false);
                  }}
                  className="w-full bg-emerald-900/50 border border-emerald-600 text-white rounded-xl px-3 py-2 text-sm font-bold flex items-center justify-center gap-2"
                >
                  <IconSettings /> إعدادات
                </button>
                <button
                  onClick={logout}
                  disabled={submitting}
                  className="logout-button w-full bg-slate-800 dark:bg-slate-950 rounded-xl px-3 py-2 text-sm font-bold flex items-center justify-center gap-2 transition-colors duration-200 ease-out disabled:opacity-50"
                >
                  <IconLogout />{" "}
                  {submitting ? "جاري الخروج..." : "تسجيل الخروج"}
                </button>
              </div>
            </div>
          )}

          {/* Scrollable Bottom Section */}
          <div
            className="navbar-bottom transition-all duration-300 ease-out"
            data-aos="slide-up"
          >
            <div className="mt-6 flex flex-col gap-2 transition-all duration-300">
              <div className="flex justify-between items-end mb-1">
                <span className="text-xs font-bold text-emerald-200 uppercase tracking-wider">
                  إنجازك العام
                </span>
                <span className="text-lg font-black text-amber-400">
                  {progress}%
                </span>
              </div>
              <div className="w-full bg-emerald-950/50 rounded-full h-3.5 p-0.5 shadow-inner">
                <div
                  className="progress-bar bg-gradient-to-l from-amber-400 to-amber-300 h-2.5 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(251,191,36,0.5)]"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Mobile View Mode Toggle */}
          <div className="lg:hidden mt-4 flex bg-emerald-900/40 p-1 rounded-2xl border border-emerald-600/50 transition-all duration-300">
            <button
              onClick={() => setViewMode("tracker")}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ease-out ${viewMode === "tracker"
                ? "bg-amber-400 text-emerald-950 shadow-md"
                : "text-emerald-100"
                }`}
            >
              المتابع اليومي
            </button>
            <button
              onClick={() => setViewMode("checklist")}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ease-out ${viewMode === "checklist"
                ? "bg-amber-400 text-emerald-950 shadow-md"
                : "text-emerald-100"
                }`}
            >
              الجدول العام
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 mt-8 max-w-7xl">
        <div className="print-only text-center mb-10 border-b-4 border-emerald-800 pb-6 dark:text-emerald-100">
          <h1 className="text-4xl font-bold font-amiri text-emerald-900 dark:text-emerald-100">
            جدول متابعة رمضان {year}
          </h1>
          <p className="text-emerald-700 dark:text-emerald-300 mt-2 text-xl font-amiri">
            "وَفِي ذَلِكَ فَلْيَتَنَافَسِ الْمُتَنَافِسُونَ"
          </p>
        </div>

        {/* Location Warning Banner (Global) */}
        {!plan.locationCity && (
          <div className="mb-8 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 p-4 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500 no-print">
            <div className="flex items-center gap-3 text-right">
              <div className="bg-amber-100 dark:bg-amber-800 p-2 rounded-xl text-amber-600 dark:text-amber-400">
                <IconClock />
              </div>
              <div>
                <h4 className="font-bold text-amber-900 dark:text-amber-100 text-sm">
                  لم يتم تحديد الموقع بعد
                </h4>
                <p className="text-amber-700/70 dark:text-amber-400/60 text-xs font-medium">
                  قم بتحديد مدينتك في الإعدادات لتتمكن من إضافة أوقات الصلاة
                  تلقائياً.
                </p>
              </div>
            </div>
            <button
              onClick={() => setModalType("plan-settings")}
              className="bg-amber-500 text-white px-5 py-2 rounded-xl text-xs font-black hover:bg-amber-600 transition-all shadow-md shrink-0"
            >
              فتح الإعدادات
            </button>
          </div>
        )}

        {viewMode === "checklist" ? (
          <div key="checklist" className="tab-content space-y-6">
            {/* --- Mobile Category Dashboard --- */}
            {isMobile && (
              <div className="grid grid-cols-2 gap-3 mb-8 no-print">
                {plan.sections
                  .sort((a, b) => a.order - b.order)
                  .map((section) => {
                    const secProgress = getSectionProgress(section);
                    const isActive = activeSectionId === section.id;
                    return (
                      <button
                        key={section.id}
                        onClick={() => setActiveSectionId(section.id)}
                        className={`relative p-4 rounded-2xl border transition-all text-right group ${isActive
                          ? "bg-emerald-600 border-emerald-500 shadow-md ring-2 ring-emerald-500/20"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-300"
                          }`}
                      >
                        <div
                          className={`text-xs font-bold mb-1 ${isActive ? "text-emerald-100" : "text-slate-400 dark:text-slate-500"}`}
                        >
                          {secProgress}% إنجاز
                        </div>
                        <div
                          className={`font-bold text-sm truncate ${isActive ? "text-white" : "text-slate-800 dark:text-slate-100"}`}
                        >
                          {section.title}
                        </div>
                        <div className="mt-3 h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`progress-bar h-full transition-all duration-500 ${isActive ? "bg-amber-400" : "bg-emerald-50"}`}
                            style={{ width: `${secProgress}%` }}
                          />
                        </div>
                      </button>
                    );
                  })}
              </div>
            )}

            <div className="flex justify-between items-center no-print">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                أقسام الجدول
              </h2>
              <button
                onClick={() => setIsCreateCategoryOpen(true)}
                className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-md flex items-center gap-2 text-sm"
              >
                <IconPlus /> إضافة قسم جديد
              </button>
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="sections" type="section">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-8"
                  >
                    {plan.sections
                      .sort((a, b) => a.order - b.order)
                      // On mobile, only show the active section
                      .filter((section) => {
                        if (isMobile) {
                          return activeSectionId
                            ? section.id === activeSectionId
                            : true;
                        }
                        return true;
                      })
                      .map((section, index) => (
                        <Draggable
                          key={section.id}
                          draggableId={section.id}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <section
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`card-hover bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-all ${snapshot.isDragging ? "shadow-2xl ring-2 ring-emerald-500 scale-[1.01]" : ""}`}
                            >
                              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-4 justify-between">
                                <div className="flex items-center gap-3">
                                  <div
                                    {...provided.dragHandleProps}
                                    className="cursor-grab active:cursor-grabbing p-1"
                                  >
                                    <IconGrip />
                                  </div>
                                  <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold">
                                    {section.title.charAt(0)}
                                  </div>
                                  <h2 className="font-bold text-slate-800 dark:text-slate-100 text-lg">
                                    {section.title}
                                  </h2>
                                </div>

                                <div className="no-print flex flex-wrap gap-2 items-center">
                                  <button
                                    onClick={() => {
                                      setModalType("add-task");
                                      setModalData({ sectionId: section.id });
                                      setAddTaskForm(prev => ({ ...prev, title: "", isScheduled: false }));
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
                                  >
                                    <IconPlus /> مهمة جديدة
                                  </button>
                                  <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />
                                  <button
                                    onClick={() => {
                                      setModalType("edit-section");
                                      setModalData(section);
                                      setModalInputValue(section.title);
                                    }}
                                    className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-200 transition-all"
                                    title="تعديل"
                                  >
                                    <IconEdit />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setModalType("delete-confirm");
                                      setModalData({
                                        type: "section",
                                        id: section.id,
                                        title: section.title,
                                      });
                                    }}
                                    className="p-1.5 rounded-lg text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-all"
                                    title="حذف"
                                  >
                                    <IconTrash />
                                  </button>
                                </div>
                              </div>

                              {renderTaskView(section)}
                            </section>
                          )}
                        </Draggable>
                      ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        ) : (
          <div key="tracker-view" className="tab-content space-y-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-3">
                <span className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-xl text-amber-600 dark:text-amber-400">
                  <IconClock />
                </span>
                {ramadanDays.find((d) => d.dayNumber === selectedDay) && (
                  <span className="flex flex-col md:flex-row md:items-baseline md:gap-2">
                    <span>
                      {
                        ramadanDays.find((d) => d.dayNumber === selectedDay)
                          ?.dayName
                      }
                      ، {selectedDay} رمضان
                    </span>
                    <span className="text-sm font-medium text-slate-400 dark:text-slate-500">
                      (
                      {
                        ramadanDays.find((d) => d.dayNumber === selectedDay)
                          ?.formattedGregorian
                      }
                      )
                    </span>
                  </span>
                )}
              </h2>

              <button
                onClick={() => setIsCreateTaskOpen(true)}
                className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg hover:bg-emerald-700 transition-all flex items-center gap-2"
              >
                <IconPlus /> إضافة عبادة جديدة
              </button>
            </div>

            <div className="pb-4 -mx-4 px-4 overflow-x-auto no-scrollbar flex gap-3">
              {ramadanDays.map((d) => (
                <button
                  key={d.dayNumber}
                  onClick={() => setSelectedDay(d.dayNumber)}
                  className={`flex-shrink-0 w-16 h-20 rounded-2xl flex flex-col items-center justify-center transition-all border-2 ${selectedDay === d.dayNumber
                    ? "bg-emerald-600 text-white border-emerald-500 shadow-md"
                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-emerald-300"
                    }`}
                >
                  <span
                    className={`text-[10px] font-bold mb-1 opacity-70 ${selectedDay === d.dayNumber ? "text-emerald-50" : ""}`}
                  >
                    {d.dayName}
                  </span>
                  <span className="text-xl font-black leading-none mb-1">
                    {d.dayNumber}
                  </span>
                  <span
                    className={`text-[9px] font-bold ${selectedDay === d.dayNumber ? "text-emerald-100/80" : "text-slate-400"}`}
                  >
                    {d.formattedGregorian}
                  </span>
                </button>
              ))}
            </div>

            {viewMode === "tracker" && (
              <div className="relative border-r-2 border-emerald-100 dark:border-emerald-900/50 pr-8 mr-4 space-y-6 py-4">
                {plan.scheduledTasks
                  .filter((t) => t.dayNumber === selectedDay)
                  .map((task) => {
                    const isDone =
                      !!checkins[checkinKey(task.taskId, selectedDay)];
                    return (
                      <div key={task.id} className="relative group">
                        <div className="absolute -right-[41px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-emerald-500 border-4 border-white dark:border-slate-950 shadow-sm z-10" />
                        <div
                          className={`card-hover p-4 md:p-6 rounded-3xl border transition-all flex items-center justify-between gap-4 ${isDone
                            ? "bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/50"
                            : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-sm"
                            }`}
                        >
                          <div className="flex items-center gap-4 flex-1">
                            <div
                              className={`text-sm font-black px-3 py-1.5 rounded-xl ${isDone
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                                }`}
                            >
                              {task.scheduledTime}
                            </div>
                            <div
                              onClick={() =>
                                toggleTask(task.taskId, selectedDay)
                              }
                              className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center cursor-pointer transition-all ${isDone
                                ? "bg-emerald-500 border-emerald-600 shadow-inner"
                                : "bg-white dark:bg-slate-800 border-slate-200"
                                }`}
                            >
                              {isDone && <IconCheck />}
                            </div>
                            <div>
                              <h3
                                className={`font-bold ${isDone ? "text-slate-400 line-through" : "text-slate-800 dark:text-slate-100"}`}
                              >
                                {task.title}
                              </h3>
                              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-widest">
                                {task.sectionTitle}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => deleteScheduled(task.id)}
                            className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-500 transition-all"
                          >
                            <IconTrash />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                {plan.scheduledTasks.length === 0 && (
                  <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                    <div className="bg-slate-50 dark:bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                      <IconClock />
                    </div>
                    <h3 className="text-slate-500 dark:text-slate-400 font-bold">
                      لا توجد مهام مجدولة لهذا اليوم
                    </h3>
                    <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">
                      ابدأ بإضافة مهام من خطتك العامة أو مهام جديدة
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

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
          modalType === "add-section"
            ? "إضافة قسم جديد"
            : modalType === "edit-section"
              ? "تعديل القسم"
              : modalType === "add-task"
                ? "إضافة مهمة جديدة"
                : modalType === "edit-task"
                  ? "تعديل المهمة"
                  : modalType === "reset-confirm"
                    ? "تصفير المتابعة"
                    : modalType === "plan-settings"
                      ? "إعدادات الخطة"
                      : "تأكيد الحذف"
        }
      >
        {modalType === "plan-settings" ? (
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
                السنة
              </label>
              <div className="relative">
                <select
                  className="appearance-none w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-emerald-500 transition-all pr-10"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  onFocus={() => setIsYearDropdownOpen(true)}
                  onBlur={() => setIsYearDropdownOpen(false)}
                >
                  {yearOptions.map((y) => (
                    <option
                      key={y}
                      value={y}
                      className="text-slate-900 dark:bg-slate-900 dark:text-slate-100"
                    >
                      {y} هـ / م
                    </option>
                  ))}
                </select>
                <div
                  className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 transition-transform duration-200 ease-out ${isYearDropdownOpen ? "rotate-180" : ""
                    }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m6 9 6 6 6-9" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
                مده شهر رمضان
              </label>
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                {([29, 30] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => handleDayCountChange(d)}
                    className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${plan.dayCount === d ? "bg-emerald-600 text-white shadow-lg" : "text-slate-500 hover:bg-slate-200/50 dark:hover:bg-slate-700/50"}`}
                  >
                    {d} يوم
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-baseline">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
                  تعديل بداية الشهر (رؤية الهلال)
                </label>
                <span
                  className={`text-xs font-black px-2 py-1 rounded-lg ${plan.ramadanOffset === 0 ? "bg-slate-100 text-slate-500" : "bg-amber-100 text-amber-700"}`}
                >
                  {plan.ramadanOffset > 0
                    ? `+${plan.ramadanOffset}`
                    : plan.ramadanOffset}{" "}
                  يوم
                </span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {[-2, -1, 0, 1, 2].map((offset) => (
                  <button
                    key={offset}
                    onClick={() => handleOffsetChange(offset)}
                    className={`py-3 rounded-xl text-sm font-bold transition-all border-2 ${plan.ramadanOffset === offset
                      ? "bg-amber-400 border-amber-300 text-emerald-950 shadow-md"
                      : "bg-slate-50 dark:bg-slate-800 border-transparent text-slate-500 hover:border-slate-200 dark:hover:border-slate-700"
                      }`}
                  >
                    {offset > 0 ? `+${offset}` : offset}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed mt-2 text-center">
                استخدم هذا الخيار إذا كانت بداية رمضان في بلدك تختلف عن الحساب
                الفلكي الافتراضي.
              </p>
            </div>

            {/* Prayer Times Location Settings */}
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <IconClock /> أوقات الصلاة التلقائية
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <SearchableSelect
                    label="الدولة"
                    placeholder="اختر الدولة..."
                    options={countries}
                    value={locationForm.country || ""}
                    loading={loadingGeo.countries}
                    onChange={(val) => {
                      const englishName =
                        countriesCacheRef.current?.english[val] || val;
                      setLocationForm((prev) => ({
                        ...prev,
                        country: val,
                        city: "",
                      }));
                    }}
                  />
                  {geoError.countries && (
                    <div className="flex items-center gap-2 text-xs text-red-500 dark:text-red-400">
                      <span>{geoError.countries}</span>
                      <button
                        onClick={() => {
                          countriesCacheRef.current = null;
                          setCountries([]);
                          setGeoError((prev) => ({
                            ...prev,
                            countries: undefined,
                          }));
                        }}
                        className="underline hover:no-underline"
                      >
                        إعادة المحاولة
                      </button>
                    </div>
                  )}
                </div>
                <div className="space-y-1.5">
                  <SearchableSelect
                    label="المدينة"
                    placeholder="اختر المدينة..."
                    options={cities}
                    value={(() => {
                      if (!locationForm.city) return "";
                      const englishCountryName =
                        countriesCacheRef.current?.english[
                        locationForm.country
                        ] || locationForm.country;
                      const cached = citiesCacheRef.current[englishCountryName];
                      if (cached) {
                        const arabicCityEntry = Object.entries(
                          cached.english,
                        ).find(([, eng]) => eng === locationForm.city);
                        if (arabicCityEntry) return arabicCityEntry[0];
                      }
                      return locationForm.city;
                    })()}
                    loading={loadingGeo.cities}
                    disabled={!locationForm.country}
                    onChange={(val) => {
                      const englishCountryName =
                        countriesCacheRef.current?.english[
                        locationForm.country
                        ] || locationForm.country;
                      const englishCityName =
                        citiesCacheRef.current[englishCountryName]?.english[
                        val
                        ] ?? val;
                      setLocationForm((prev) => ({
                        ...prev,
                        city: englishCityName,
                      }));
                    }}
                  />
                  {geoError.cities && (
                    <div className="flex items-center gap-2 text-xs text-red-500 dark:text-red-400">
                      <span>{geoError.cities}</span>
                      <button
                        onClick={() => {
                          const englishCountryName =
                            countriesCacheRef.current?.english[
                            locationForm.country
                            ] || locationForm.country;
                          delete citiesCacheRef.current[englishCountryName];
                          setCities([]);
                          setGeoError((prev) => ({
                            ...prev,
                            cities: undefined,
                          }));
                        }}
                        className="underline hover:no-underline"
                      >
                        إعادة المحاولة
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase pr-1">
                  طريقة الحساب
                </label>
                <select
                  className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-emerald-500 transition-all"
                  value={locationForm.method}
                  onChange={(e) =>
                    setLocationForm((prev) => ({
                      ...prev,
                      method: Number(e.target.value),
                    }))
                  }
                >
                  <option value={2}>رابطة العالم الإسلامي</option>
                  <option value={3}>الهيئة العامة المصرية للمساحة</option>
                  <option value={4}>جامعة أم القرى، مكة المكرمة</option>
                  <option value={5}>
                    الاتحاد الإسلامي في أمريكا الشمالية (ISNA)
                  </option>
                  <option value={1}>جامعة العلوم الإسلامية، كراتشي</option>
                </select>
              </div>

              {syncProgress !== null && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-[10px] font-bold text-slate-400">
                    <span>جاري المزامنة...</span>
                    <span>{syncProgress}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                      style={{ width: `${syncProgress}%` }}
                    />
                  </div>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleLocationUpdate}
                  disabled={
                    submitting || !locationForm.city || !locationForm.country
                  }
                  className="flex-1 bg-slate-800 text-white py-3 rounded-xl text-xs font-bold hover:bg-slate-700 transition-all disabled:opacity-50"
                >
                  حفظ الموقع
                </button>
                <button
                  onClick={syncPrayers}
                  disabled={
                    submitting || !plan?.locationCity || syncProgress !== null
                  }
                  className="flex-[2] bg-emerald-600 text-white py-3 rounded-xl text-xs font-black hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {syncProgress !== null ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="animate-spin"
                    >
                      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                      <path d="M3 3v5h5" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                      <path d="M3 3v5h5" />
                      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                      <path d="M16 16h5v5" />
                    </svg>
                  )}
                  مزامنة أوقات الصلاة
                </button>
              </div>
              <p className="text-[9px] text-slate-400 text-center leading-relaxed">
                * سيتم توزيع الصلوات على الـ 30 يوماً تلقائياً بناءً على موقعك.
              </p>
            </div>

            <button
              onClick={() => setModalType(null)}
              className="w-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 py-4 rounded-2xl font-bold hover:opacity-90 transition-all mt-4 shadow-xl"
            >
              تم
            </button>
          </div>
        ) : modalType === "reset-confirm" ? (
          <div className="space-y-4">
            <p className="text-slate-600 dark:text-slate-400">
              هل تريد تصفير المتابعة للسنة الحالية{" "}
              <span className="font-bold text-slate-900 dark:text-slate-100">
                {year}
              </span>
              ؟
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400 font-bold">
              هذا الإجراء لا يمكن التراجع عنه.
            </p>
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
            <p className="text-slate-600 dark:text-slate-400">
              هل أنت متأكد من حذف{" "}
              <span className="font-bold text-slate-900 dark:text-slate-100">
                {modalData?.title}
              </span>
              ؟
            </p>
            {modalData?.type === "section" && (
              <p className="text-xs text-red-500 dark:text-red-400 font-bold">
                سيتم حذف جميع المهام التابعة لهذا القسم أيضاً.
              </p>
            )}
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
        ) : modalType === "add-task" ? (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                الاسم
              </label>
              <input
                autoFocus
                type="text"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                placeholder="أدخل اسم المهمة..."
                value={addTaskForm.title}
                onChange={(e) => setAddTaskForm(prev => ({ ...prev, title: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && handleModalSubmit()}
              />
            </div>

            {/* Scheduling Toggle */}
            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <IconClock />
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  جدولة تلقائية؟
                </span>
              </div>
              <button
                onClick={() => setAddTaskForm(prev => ({ ...prev, isScheduled: !prev.isScheduled }))}
                className={`w-12 h-6 rounded-full transition-colors relative ${addTaskForm.isScheduled ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${addTaskForm.isScheduled ? "left-1" : "left-7"}`} />
              </button>
            </div>

            {addTaskForm.isScheduled && (
              <div className="space-y-4 animate-in slide-in-from-top-2 border-t border-slate-100 dark:border-slate-800 pt-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2 mr-1">
                    التكرار
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setAddTaskForm(prev => ({ ...prev, scheduleType: 'daily' }))}
                      className={`flex-1 py-2 rounded-xl text-sm font-bold border-2 transition-all ${addTaskForm.scheduleType === 'daily' ? 'bg-emerald-100 border-emerald-500 text-emerald-800' : 'bg-white dark:bg-slate-800 border-transparent text-slate-500'}`}
                    >
                      يومياً
                    </button>
                    <button
                      onClick={() => setAddTaskForm(prev => ({ ...prev, scheduleType: 'weekly' }))}
                      className={`flex-1 py-2 rounded-xl text-sm font-bold border-2 transition-all ${addTaskForm.scheduleType === 'weekly' ? 'bg-emerald-100 border-emerald-500 text-emerald-800' : 'bg-white dark:bg-slate-800 border-transparent text-slate-500'}`}
                    >
                      أسبوعياً
                    </button>
                  </div>
                </div>

                {addTaskForm.scheduleType === 'weekly' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2 mr-1">
                      يوم الأسبوع
                    </label>
                    <select
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-emerald-500 transition-all text-right"
                      value={addTaskForm.selectedDayOfWeek}
                      onChange={(e) => setAddTaskForm(prev => ({ ...prev, selectedDayOfWeek: Number(e.target.value) }))}
                    >
                      <option value="6">السبت</option>
                      <option value="0">الأحد</option>
                      <option value="1">الاثنين</option>
                      <option value="2">الثلاثاء</option>
                      <option value="3">الأربعاء</option>
                      <option value="4">الخميس</option>
                      <option value="5">الجمعة</option>
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2 mr-1">
                      الوقت
                    </label>
                    <input
                      type="time"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-lg font-bold focus:ring-2 focus:ring-emerald-500 transition-all ltr:text-center text-center"
                      value={addTaskForm.time}
                      onChange={(e) => setAddTaskForm(prev => ({ ...prev, time: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2 mr-1">
                      المدة (د)
                    </label>
                    <input
                      type="number"
                      min="5"
                      step="5"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-lg font-bold focus:ring-2 focus:ring-emerald-500 transition-all text-center"
                      value={addTaskForm.duration}
                      onChange={(e) => setAddTaskForm(prev => ({ ...prev, duration: Number(e.target.value) }))}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Progress Bar (if syncing) */}
            {syncProgress !== null && (
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-[10px] font-bold text-slate-400">
                  <span>جاري الجدولة...</span>
                  <span>{syncProgress}%</span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                    style={{ width: `${syncProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleModalSubmit}
                disabled={submitting || !addTaskForm.title.trim()}
                className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {submitting ? "جاري الحفظ..." : "حفظ المهمة"}
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
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                الاسم
              </label>
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
            {modalType === "edit-task" && (
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  القسم (التصنيف)
                </label>
                <select
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-900 dark:text-slate-100 cursor-pointer"
                  value={modalSectionValue}
                  onChange={(e) => setModalSectionValue(e.target.value)}
                >
                  {plan?.sections.map((sec) => (
                    <option key={sec.id} value={sec.id}>
                      {sec.title}
                    </option>
                  ))}
                </select>
              </div>
            )}
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

      {/* --- Tracker Modal --- */}
      <Modal
        isOpen={trackerModalOpen}
        onClose={() => setTrackerModalOpen(false)}
        title={
          trackerForm.isRecurring
            ? "جدولة مهمة متكررة"
            : `جدولة مهمة لليوم ${selectedDay}`
        }
      >
        <div className="space-y-5">
          {/* Recurring Toggle */}
          <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
              تكرار المهمة؟
            </span>
            <button
              onClick={() =>
                setTrackerForm((prev) => ({
                  ...prev,
                  isRecurring: !prev.isRecurring,
                  scheduleType: !prev.isRecurring ? "daily" : "once",
                }))
              }
              className={`w-12 h-6 rounded-full transition-colors relative ${trackerForm.isRecurring ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"}`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${trackerForm.isRecurring ? "left-1" : "left-7"}`}
              />
            </button>
          </div>

          {trackerForm.isRecurring && (
            <div className="space-y-3 animate-in slide-in-from-top-2">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2 mr-1">
                  التكرار
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setTrackerForm((prev) => ({
                        ...prev,
                        scheduleType: "daily",
                      }))
                    }
                    className={`flex-1 py-2 rounded-xl text-sm font-bold border-2 transition-all ${trackerForm.scheduleType === "daily" ? "bg-emerald-100 border-emerald-500 text-emerald-800" : "bg-white dark:bg-slate-800 border-transparent text-slate-500"}`}
                  >
                    يومياً (كل أيام رمضان)
                  </button>
                  <button
                    onClick={() =>
                      setTrackerForm((prev) => ({
                        ...prev,
                        scheduleType: "weekly",
                      }))
                    }
                    className={`flex-1 py-2 rounded-xl text-sm font-bold border-2 transition-all ${trackerForm.scheduleType === "weekly" ? "bg-emerald-100 border-emerald-500 text-emerald-800" : "bg-white dark:bg-slate-800 border-transparent text-slate-500"}`}
                  >
                    أسبوعياً
                  </button>
                </div>
              </div>

              {trackerForm.scheduleType === "weekly" && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2 mr-1">
                    يوم الأسبوع
                  </label>
                  <select
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-emerald-500 transition-all text-right"
                    value={trackerForm.selectedDayOfWeek}
                    onChange={(e) =>
                      setTrackerForm((prev) => ({
                        ...prev,
                        selectedDayOfWeek: Number(e.target.value),
                      }))
                    }
                  >
                    <option value="6">السبت</option>
                    <option value="0">الأحد</option>
                    <option value="1">الاثنين</option>
                    <option value="2">الثلاثاء</option>
                    <option value="3">الأربعاء</option>
                    <option value="4">الخميس</option>
                    <option value="5">الجمعة</option>
                  </select>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2 mr-1">
                الوقت
              </label>
              <input
                type="time"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-lg font-bold focus:ring-2 focus:ring-emerald-500 transition-all ltr:text-center text-center"
                value={trackerForm.time}
                onChange={(e) =>
                  setTrackerForm((prev) => ({ ...prev, time: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2 mr-1">
                المدة (دقيقة)
              </label>
              <input
                type="number"
                min="5"
                step="5"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-lg font-bold focus:ring-2 focus:ring-emerald-500 transition-all text-center"
                value={trackerForm.duration}
                onChange={(e) =>
                  setTrackerForm((prev) => ({
                    ...prev,
                    duration: Number(e.target.value),
                  }))
                }
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2 mr-1">
              المهمة
            </label>
            <select
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-emerald-500 transition-all"
              value={trackerForm.taskId ? "existing" : "new"}
              onChange={(e) =>
                setTrackerForm((prev) => ({
                  ...prev,
                  taskId: e.target.value === "new" ? "" : "placeholder",
                }))
              }
            >
              <option value="existing">من الخطة الحالية</option>
              <option value="new">مهمة جديدة بالكامل</option>
            </select>
          </div>

          {trackerForm.taskId !== "" ? (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2 mr-1">
                اختر المهمة
              </label>
              <select
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-emerald-500 transition-all"
                value={
                  trackerForm.taskId === "placeholder" ? "" : trackerForm.taskId
                }
                onChange={(e) =>
                  setTrackerForm((prev) => ({
                    ...prev,
                    taskId: e.target.value,
                  }))
                }
              >
                <option value="">-- اختر من القائمة --</option>
                {plan.sections.map((s) => (
                  <optgroup key={s.id} label={s.title}>
                    {s.tasks.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2 mr-1">
                  اسم المهمة
                </label>
                <input
                  type="text"
                  placeholder="مثال: قراءة صفحة من التفسير"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-emerald-500 transition-all"
                  value={trackerForm.title}
                  onChange={(e) =>
                    setTrackerForm((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2 mr-1">
                  القسم (التصنيف)
                </label>
                <select
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-emerald-500 transition-all"
                  value={trackerForm.sectionId}
                  onChange={(e) =>
                    setTrackerForm((prev) => ({
                      ...prev,
                      sectionId: e.target.value,
                    }))
                  }
                >
                  <option value="">-- اختر القسم --</option>
                  {plan.sections.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Progress Bar (if syncing) */}
          {syncProgress !== null && (
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-[10px] font-bold text-slate-400">
                <span>جاري الجدولة...</span>
                <span>{syncProgress}%</span>
              </div>
              <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                  style={{ width: `${syncProgress}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleTrackerSubmit}
              disabled={
                submitting ||
                (!trackerForm.taskId &&
                  (!trackerForm.title || !trackerForm.sectionId))
              }
              className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg disabled:opacity-50"
            >
              {submitting ? "جاري الحفظ..." : "إضافة للجدول"}
            </button>
            <button
              onClick={() => setTrackerModalOpen(false)}
              className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 py-4 rounded-2xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
            >
              إلغاء
            </button>
          </div>
        </div>
      </Modal>

      {/* --- New Modals --- */}
      {plan && (
        <>
          <CreateCategoryModal
            isOpen={isCreateCategoryOpen}
            onClose={() => setIsCreateCategoryOpen(false)}
            planId={plan.planId}
            ramadanDays={ramadanDays}
            onSuccess={() => {
              mutate();
              setNotification({ message: "تم إنشاء القسم بنجاح", type: "success" });
              setTimeout(() => setNotification(null), 3000);
            }}
          />
          <CreateTaskModal
            isOpen={isCreateTaskOpen}
            onClose={() => setIsCreateTaskOpen(false)}
            planId={plan.planId}
            sections={plan.sections}
            ramadanDays={ramadanDays}
            onSuccess={() => {
              mutate();
              setNotification({ message: "تم إنشاء المهمة وجدولتها بنجاح", type: "success" });
              setTimeout(() => setNotification(null), 3000);
            }}
          />
        </>
      )}

      {/* --- Notification Toast --- */}
      {notification && (
        <div
          className={`fixed bottom-6 left-6 z-[200] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-10 duration-300 ${notification.type === "success"
            ? "bg-emerald-600 text-white"
            : notification.type === "loading"
              ? "bg-slate-800 text-white"
              : "bg-amber-500 text-white"
            }`}
        >
          {notification.type === "loading" ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : notification.type === "success" ? (
            <div className="bg-white/20 p-1 rounded-full">
              <IconCheck />
            </div>
          ) : (
            <div className="bg-white/20 p-1 rounded-full">
              <IconClock />
            </div>
          )}
          <span className="font-bold text-sm">{notification.message}</span>
          {notification.type !== "loading" && (
            <button
              onClick={() => setNotification(null)}
              className="text-white/60 hover:text-white ml-2"
            >
              <IconClose />
            </button>
          )}
        </div>
      )}

      {/* --- Error Toast --- */}
      {error && (
        <div className="fixed bottom-6 left-6 z-[200] bg-red-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-10 duration-300">
          <div className="bg-white/20 p-1 rounded-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" x2="12" y1="8" y2="12" />
              <line x1="12" x2="12.01" y1="16" y2="16" />
            </svg>
          </div>
          <span className="font-medium">{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-white/60 hover:text-white ml-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
