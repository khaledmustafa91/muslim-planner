"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// --- Icons ---
const IconUser = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);

const IconLock = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
);

const IconArrowRight = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
);

const IconMoon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#fcd34d" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
  </svg>
);

interface AuthFormProps {
  mode: "login" | "signup";
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/signup";
  const title = mode === "login" ? "تسجيل الدخول" : "إنشاء حساب جديد";
  const subtitle = mode === "login" ? "أهلاً بك مجدداً في رفيقك الإيماني" : "انضم إلينا وابدأ رحلة تنظيم عبادتك";
  const switchHref = mode === "login" ? "/signup" : "/login";
  const switchText = mode === "login" ? "ليس لديك حساب؟" : "لديك حساب بالفعل؟";
  const switchAction = mode === "login" ? "سجل الآن" : "دخول";

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    if (mode === "signup" && password !== confirmPassword) {
      setError("كلمات المرور غير متطابقة");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "تعذر إتمام العملية");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("تعذر الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-slate-50 dark:bg-slate-950 transition-colors font-tajawal relative overflow-hidden">
      {/* Background Ornaments */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20 dark:opacity-10">
        <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] bg-emerald-500 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[10%] -left-[10%] w-[30%] h-[30%] bg-amber-400 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-6 group">
            <div className="bg-emerald-800 p-2.5 rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
              <IconMoon />
            </div>
            <span className="text-3xl font-amiri font-bold text-emerald-900 dark:text-emerald-100">رفيق المسلم</span>
          </Link>
          <h1 className="text-2xl md:text-3xl font-amiri font-bold text-slate-900 dark:text-white">{title}</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">{subtitle}</p>
        </div>

        <div className="rounded-3xl bg-white dark:bg-slate-900 shadow-[0_20px_50px_rgba(0,0,0,0.05)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-slate-100 dark:border-slate-800 p-8 md:p-10">
          <form className="space-y-6" onSubmit={onSubmit}>
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mr-1">اسم المستخدم</label>
              <div className="relative group">
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                  <IconUser />
                </div>
                <input
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 pr-12 pl-4 py-3.5 text-right focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all dark:text-slate-100 placeholder:text-slate-400"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  minLength={3}
                  maxLength={32}
                  placeholder="أدخل اسم المستخدم"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mr-1">كلمة المرور</label>
              <div className="relative group">
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                  <IconLock />
                </div>
                <input
                  type="password"
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 pr-12 pl-4 py-3.5 text-right focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all dark:text-slate-100 placeholder:text-slate-400"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  maxLength={72}
                  placeholder="••••••••"
                />
              </div>
            </div>

            {mode === "signup" && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mr-1">تأكيد كلمة المرور</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                    <IconLock />
                  </div>
                  <input
                    type="password"
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 pr-12 pl-4 py-3.5 text-right focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all dark:text-slate-100 placeholder:text-slate-400"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    maxLength={72}
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}

            {error ? (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white py-4 font-bold transition-all shadow-lg shadow-emerald-600/10 hover:shadow-emerald-600/20 active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {title}
                  <IconArrowRight />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-50 dark:border-slate-800 text-center">
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              {switchText}{" "}
              <Link href={switchHref} className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline transition-all">
                {switchAction}
              </Link>
            </p>
          </div>
        </div>
        
        <p className="mt-8 text-center text-slate-400 dark:text-slate-600 text-xs">
          © {new Date().getFullYear()} رفيق المسلم - تقبل الله طاعاتكم
        </p>
      </div>
    </main>
  );
}
