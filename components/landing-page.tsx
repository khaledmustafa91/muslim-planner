"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

// --- Icons ---
const IconMoon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="#fcd34d" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
  </svg>
);

const IconCheck = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconStar = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-amber-400">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

export function LandingPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors font-amiri overflow-hidden">
      {/* Abstract Background Patterns */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20 dark:opacity-10">
        <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] bg-emerald-500 rounded-full blur-[120px]" />
        <div className="absolute top-[20%] -left-[10%] w-[30%] h-[30%] bg-amber-400 rounded-full blur-[100px]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 container mx-auto px-6 py-8 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-800 p-2 rounded-xl shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#fcd34d" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
            </svg>
          </div>
          <span className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">رفيق المسلم</span>
        </div>
        
        <div className="flex items-center gap-4">
          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-xl bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300"
            >
              {theme === "dark" ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
              )}
            </button>
          )}
          <Link href="/login" className="hidden md:block text-slate-600 dark:text-slate-400 font-bold hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
            تسجيل الدخول
          </Link>
          <Link href="/signup" className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-md hover:shadow-lg active:scale-95">
            ابدأ الآن
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 container mx-auto px-6 pt-12 md:pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-sm font-bold mb-8 animate-bounce">
          <IconStar />
          <span>رفيقك الدائم في رحلة العبادة والتقرب إلى الله</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white mb-6 leading-tight">
          نظّم حياتك الإيمانية وابقَ <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-emerald-400">على المسار الصحيح</span>
        </h1>
        
        <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto mb-12 leading-relaxed">
          خطط لصلواتك، ختماتك، وأعمالك الصالحة بكل سهولة. تابع تقدمك اليومي وابقَ متحمساً في عبادتك طوال العام وفي كل وقت.
        </p>

        <div className="flex flex-col md:flex-row gap-4 justify-center items-center mb-16">
          <Link href="/signup" className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-10 py-4 rounded-2xl text-xl font-bold transition-all shadow-xl hover:shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-2 group">
            ابدأ رحلتك مجاناً
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-1 transition-transform">
              <path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>
            </svg>
          </Link>
          <Link href="/login" className="w-full md:w-auto bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 px-10 py-4 rounded-2xl text-xl font-bold transition-all hover:bg-slate-50 dark:hover:bg-slate-800 shadow-md">
            لديك حساب بالفعل؟
          </Link>
        </div>

        {/* Feature Preview Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-right">
          {[
            {
              title: "تخصيص كامل",
              desc: "أضف المهام والأقسام التي تناسب روتينك اليومي، من الأذكار والسنن إلى الأوراد القرآنية.",
              icon: "⚙️"
            },
            {
              title: "متابعة الإنجاز",
              desc: "إحصائيات دقيقة لتقدمك اليومي والعام لتبقيك دائماً على المسار الصحيح في طريق عبادتك.",
              icon: "📊"
            },
            {
              title: "جاهز للطباعة",
              desc: "صمم خطتك الروحية وقم بطباعتها لتكون أمام عينيك دائماً أو شاركها مع عائلتك وأصدقائك.",
              icon: "🖨️"
            }
          ].map((feature, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow group">
              <div className="text-4xl mb-6 bg-slate-50 dark:bg-slate-800 w-16 h-16 flex items-center justify-center rounded-2xl group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{feature.title}</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Social Proof / Quote */}
      <section className="bg-emerald-800 py-16 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-700 rounded-full blur-3xl opacity-50 -mr-32 -mt-32" />
        <div className="container mx-auto px-6 text-center relative z-10">
          <p className="text-3xl md:text-4xl font-amiri italic mb-6">"وَفِي ذَلِكَ فَلْيَتَنَافَسِ الْمُتَنَافِسُونَ"</p>
          <div className="w-20 h-1 bg-amber-400 mx-auto" />
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-200 dark:border-slate-800">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6 text-slate-500 dark:text-slate-400 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>© {new Date().getFullYear()} رفيق المسلم - رفيقك نحو الأفضل</span>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 border-l border-slate-200 dark:border-slate-800 pl-6 ml-6 hidden md:flex">
              <a 
                href="https://www.linkedin.com/in/khaledmustafa8/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-emerald-600 transition-colors"
                aria-label="LinkedIn"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
              </a>
              <a 
                href="mailto:khaled.mustafa1297@gmail.com" 
                className="hover:text-emerald-600 transition-colors"
                aria-label="Email"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              </a>
            </div>
            <div className="flex gap-8">
              <Link href="/signup" className="hover:text-emerald-600 transition-colors">إنشاء حساب</Link>
              <Link href="/login" className="hover:text-emerald-600 transition-colors">تسجيل الدخول</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
