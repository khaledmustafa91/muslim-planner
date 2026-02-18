import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch(
      "https://restcountries.com/v3.1/all?fields=name,translations",
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) throw new Error("فشل تحميل قائمة الدول");

    const data = await res.json();
    const english: Record<string, string> = {};
    const arabic: string[] = [];

    data.forEach((country: { name: { common: string }; translations?: { ara?: { common?: string } } }) => {
      const englishName = country.name.common;
      const arabicName = country.translations?.ara?.common || englishName;
      english[arabicName] = englishName;
      arabic.push(arabicName);
    });

    arabic.sort((a, b) => a.localeCompare(b, "ar"));

    return NextResponse.json({ arabic, english });
  } catch (err) {
    console.error("[API_GEO_COUNTRIES]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "حدث خطأ أثناء تحميل قائمة الدول" },
      { status: 500 }
    );
  }
}
