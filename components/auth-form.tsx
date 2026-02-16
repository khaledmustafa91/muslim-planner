"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

interface AuthFormProps {
  mode: "login" | "signup";
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/signup";
  const title = mode === "login" ? "تسجيل الدخول" : "إنشاء حساب";
  const switchHref = mode === "login" ? "/signup" : "/login";
  const switchText = mode === "login" ? "ليس لديك حساب؟ إنشاء حساب" : "لديك حساب بالفعل؟ تسجيل الدخول";

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

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
    <main className="min-h-screen flex items-center justify-center px-4 bg-slate-50 dark:bg-slate-950 transition-colors">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 p-8">
        <h1 className="text-3xl font-amiri font-bold text-emerald-800 dark:text-emerald-400 text-center">{title}</h1>
        <form className="mt-8 space-y-5" onSubmit={onSubmit}>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">اسم المستخدم</label>
            <input
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-left focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:text-slate-100"
              dir="ltr"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              maxLength={32}
              placeholder="username"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">كلمة المرور</label>
            <input
              type="password"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-left focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:text-slate-100"
              dir="ltr"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              maxLength={72}
              placeholder="••••••••"
            />
          </div>

          {error ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 rounded-xl">
              <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-emerald-700 dark:bg-emerald-600 text-white py-3 font-bold hover:bg-emerald-800 dark:hover:bg-emerald-500 transition-all shadow-md active:scale-[0.98] disabled:opacity-60"
          >
            {loading ? "جاري الإرسال..." : title}
          </button>
        </form>

        <a href={switchHref} className="block mt-6 text-sm text-center text-slate-500 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors underline-offset-4 hover:underline">
          {switchText}
        </a>
      </div>
    </main>
  );
}
