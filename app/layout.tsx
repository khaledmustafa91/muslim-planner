import type { Metadata } from "next";
import { Amiri, Tajawal } from "next/font/google";
import "./globals.css";

const tajawal = Tajawal({
  subsets: ["arabic", "latin"],
  variable: "--font-tajawal",
  weight: ["400", "500", "700"]
});

const amiri = Amiri({
  subsets: ["arabic", "latin"],
  variable: "--font-amiri",
  weight: ["400", "700"]
});

export const metadata: Metadata = {
  title: "Ramadan Planner | رفيق المسلم",
  description: "Ramadan planner with dynamic sections and user authentication"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${tajawal.variable} ${amiri.variable} font-tajawal bg-slate-50 text-slate-900`}>
        {children}
      </body>
    </html>
  );
}
