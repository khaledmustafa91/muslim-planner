import { NextRequest, NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/auth";
import { badRequest } from "@/lib/validation";
import { getPlanByYear, scheduleTask } from "@/lib/db";

// Helper to format 24h time from "HH:mm (Timezone)" or similar strings
function formatTime(raw: string): string {
  // Aladhan usually returns "HH:mm" or "HH:mm (EEST)"
  return raw.split(" ")[0];
}

// Add minutes to "HH:mm" time
function addMinutes(time: string, mins: number): string {
  const [h, m] = time.split(":").map(Number);
  const date = new Date();
  date.setHours(h, m + mins, 0);
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromCookies();
  if (!session) return badRequest("غير مصرح", 401);

  const { planId, year } = await request.json().catch(() => ({}));
  if (!planId || !year) return badRequest("البيانات ناقصة");

  try {
    const plan = await getPlanByYear(session.userId, year);
    if (!plan.locationCity || !plan.locationCountry) {
      return badRequest("يرجى تحديد الموقع أولاً في الإعدادات");
    }

    // 1. Fetch Ramadan times from Aladhan API
    // Ramadan is typically the 9th month. Aladhan allows fetching by Hijri year/month.
    // However, it's easier to fetch the Gregorian month that contains Ramadan.
    // For simplicity and accuracy, we'll fetch the specific Gregorian month
    // We already have ramadanDays calculated on client, but we need it here.
    // Let's use the Aladhan calendar for the specific year/month.
    
    // We need to know which Gregorian month Ramadan falls into.
    // From our date-utils logic, we can find the start date.
    const ramadanStart = plan.ramadanOffset; // Not enough. 
    // Let's just fetch the whole Gregorian year's calendar or find the specific month.
    // A better way: fetch for the city/country using the Gregorian date of each Ramadan day.
    
    // Actually, Aladhan has an endpoint for Hijri Calendar:
    // /v1/hijriCalendarByCity/:year/:month?city=:city&country=:country&method=:method
    // Ramadan is month 9.
    
    // We need to map Gregorian year to Hijri year approximately.
    const hijriYear = year - 579; // Approximate mapping for 2025 -> 1446
    // Better: Get Hijri year from a sample date
    const sampleDate = new Date(year, 2, 1); // March 1st usually has some Ramadan context
    const hYear = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', { year: 'numeric' }).format(sampleDate);
    const numericHijriYear = parseInt(hYear.replace(/[^0-9]/g, ''));

    const apiUrl = `https://api.aladhan.com/v1/hijriCalendarByCity/${numericHijriYear}/9?city=${plan.locationCity}&country=${plan.locationCountry}&method=${plan.calculationMethod ?? 2}`;
    
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (data.code !== 200) {
      return badRequest("فشل الاتصال بمزود أوقات الصلاة");
    }

    const calendar = data.data; // Array of days in Ramadan

    // 2. Define the tasks we want to match
    const matchers = [
      { name: "الفجر", key: "Fajr" },
      { name: "الظهر", key: "Dhuhr" },
      { name: "العصر", key: "Asr" },
      { name: "المغرب", key: "Maghrib" },
      { name: "العشاء", key: "Isha" },
      { name: "قيام الليل (التراويح)", key: "Isha", offset: 15 } // Taraweeh starts 15m after Isha
    ];

    // 3. Find these tasks in the user's plan
    const taskMap = new Map<string, string>(); // matcher.name -> taskId
    for (const section of plan.sections) {
      for (const task of section.tasks) {
        const matcher = matchers.find(m => m.name === task.title);
        if (matcher) {
          taskMap.set(matcher.name, task.id);
        }
      }
    }

    // 4. Create schedules for each day
    let count = 0;
    for (let i = 0; i < calendar.length; i++) {
      const dayData = calendar[i];
      const dayNumber = i + 1;
      const timings = dayData.timings;

      for (const matcher of matchers) {
        const taskId = taskMap.get(matcher.name);
        if (taskId) {
          let time = formatTime(timings[matcher.key]);
          if (matcher.offset) {
            time = addMinutes(time, matcher.offset);
          }
          await scheduleTask(taskId, dayNumber, time, matcher.name.includes("التراويح") ? 60 : 20);
          count++;
        }
      }
    }

    return NextResponse.json({ ok: true, syncedCount: count });
  } catch (error) {
    console.error("[SYNC_PRAYERS_ERROR]", error);
    return badRequest("حدث خطأ أثناء مزامنة أوقات الصلاة");
  }
}
