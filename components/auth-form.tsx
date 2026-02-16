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
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-lg border border-slate-200 p-6">
        <h1 className="text-2xl font-amiri font-bold text-emerald-800 text-center">{title}</h1>
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="block text-sm mb-1">اسم المستخدم</label>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-left"
              dir="ltr"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              maxLength={32}
            />
          </div>
          <div>
            <label className="block text-sm mb-1">كلمة المرور</label>
            <input
              type="password"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-left"
              dir="ltr"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              maxLength={72}
            />
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-emerald-700 text-white py-2 font-bold hover:bg-emerald-800 disabled:opacity-60"
          >
            {loading ? "جاري الإرسال..." : title}
          </button>
        </form>

        <a href={switchHref} className="block mt-4 text-sm text-center text-emerald-700 hover:underline">
          {switchText}
        </a>
      </div>
    </main>
  );
}
