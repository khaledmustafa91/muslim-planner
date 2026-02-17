"use client";

import { useState, useRef, useEffect } from "react";

interface SearchableSelectProps {
  label: string;
  placeholder: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  loading?: boolean;
}

export function SearchableSelect({
  label,
  placeholder,
  options,
  value,
  onChange,
  disabled = false,
  loading = false
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 100); // Limit visible for performance

  return (
    <div className="space-y-1.5 relative" ref={containerRef}>
      <label className="text-[10px] font-black text-slate-400 uppercase pr-1">{label}</label>
      
      <div className="relative">
        <input
          type="text"
          disabled={disabled}
          placeholder={loading ? "جاري التحميل..." : placeholder}
          className={`w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-emerald-500 transition-all ${
            disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
          }`}
          value={isOpen ? search : value}
          onChange={(e) => {
            setSearch(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => {
            setSearch("");
            setIsOpen(true);
          }}
        />
        
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
          {loading ? (
            <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="m6 9 6 6 6-9"/>
            </svg>
          )}
        </div>
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-[100] w-full mt-1 max-h-60 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl no-scrollbar animate-in fade-in slide-in-from-top-2 duration-200">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <button
                key={option}
                type="button"
                className={`w-full text-right px-4 py-2.5 text-sm font-medium hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors border-b border-slate-50 dark:border-slate-800 last:border-none ${
                  value === option ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400" : "text-slate-700 dark:text-slate-300"
                }`}
                onClick={() => {
                  onChange(option);
                  setSearch("");
                  setIsOpen(false);
                }}
              >
                {option}
              </button>
            ))
          ) : (
            <div className="px-4 py-3 text-xs text-slate-400 text-center">لا توجد نتائج</div>
          )}
        </div>
      )}
    </div>
  );
}
