import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

let cityArabicMap: Record<string, string> | null = null;

async function getCityArabicMap(): Promise<Record<string, string>> {
  if (cityArabicMap) return cityArabicMap;
  try {
    const filePath = path.join(process.cwd(), "public", "data", "city-arabic.json");
    const raw = await readFile(filePath, "utf-8");
    cityArabicMap = JSON.parse(raw) as Record<string, string>;
    return cityArabicMap;
  } catch {
    return {};
  }
}

function toArabic(name: string, map: Record<string, string>): string {
  return map[name] ?? name;
}

export async function GET(request: NextRequest) {
  const country = request.nextUrl.searchParams.get("country");
  if (!country || typeof country !== "string") {
    return NextResponse.json(
      { error: "معرف الدولة مطلوب" },
      { status: 400 }
    );
  }

  try {
    const [citiesRes, map] = await Promise.all([
      fetch("https://countriesnow.space/api/v0.1/countries/cities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country: country.trim() }),
      }),
      getCityArabicMap(),
    ]);

    if (!citiesRes.ok) throw new Error("فشل تحميل قائمة المدن");

    const data = await citiesRes.json();
    if (data.error) throw new Error(data.msg || "فشل تحميل قائمة المدن");

    const cityNames: string[] = data.data || [];
    const english: Record<string, string> = {};
    const arabic: string[] = [];

    cityNames.forEach((cityName: string) => {
      const arabicName = toArabic(cityName, map);
      english[arabicName] = cityName;
      arabic.push(arabicName);
    });

    arabic.sort((a, b) => a.localeCompare(b, "ar"));

    return NextResponse.json({ arabic, english });
  } catch (err) {
    console.error("[API_GEO_CITIES]", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "حدث خطأ أثناء تحميل قائمة المدن",
      },
      { status: 500 }
    );
  }
}
