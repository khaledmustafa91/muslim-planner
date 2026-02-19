import { NextRequest } from "next/server";
import { getSessionFromCookies } from "@/lib/auth";
import { getPlanByYear, scheduleTasksBatch } from "@/lib/db";

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
  if (!session) {
    return new Response(JSON.stringify({ error: "غير مصرح" }), { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { planId, year } = body;
  if (!planId || !year) {
    return new Response(JSON.stringify({ error: "البيانات ناقصة" }), { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const emit = (data: object) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

      try {
        const plan = await getPlanByYear(session.userId, year);
        if (!plan.locationCity || !plan.locationCountry) {
          emit({ error: "يرجى تحديد الموقع أولاً في الإعدادات" });
          controller.close();
          return;
        }

        function getHijriYearForRamadan(gregorianYear: number): number {
          for (let d = 0; d < 366; d++) {
            const date = new Date(gregorianYear, 0, d + 1);
            const fmt = (opt: Intl.DateTimeFormatOptions) =>
              new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', opt).format(date);
            if (fmt({ month: 'numeric' }) === "9" && fmt({ day: 'numeric' }) === "1") {
              return parseInt(fmt({ year: 'numeric' }));
            }
          }
          return gregorianYear + 579; // fallback approximation
        }

        const numericHijriYear = getHijriYearForRamadan(plan.ramadanYear);

        const apiUrl = `https://api.aladhan.com/v1/hijriCalendarByCity/${numericHijriYear}/9?city=${plan.locationCity}&country=${plan.locationCountry}&method=${plan.calculationMethod ?? 2}`;

        const response = await fetch(apiUrl);
        const data = await response.json();

        if (data.code !== 200) {
          emit({ error: "فشل الاتصال بمزود أوقات الصلاة" });
          controller.close();
          return;
        }

        const calendar = data.data;

        const matchers = [
          { name: "الفجر", key: "Fajr" },
          { name: "الظهر", key: "Dhuhr" },
          { name: "العصر", key: "Asr" },
          { name: "المغرب", key: "Maghrib" },
          { name: "العشاء", key: "Isha" },
          { name: "قيام الليل (التراويح)", key: "Isha", offset: 15 }
        ];

        const taskMap = new Map<string, string>(); // matcher.name -> taskId
        for (const section of plan.sections) {
          for (const task of section.tasks) {
            const matcher = matchers.find(m => m.name === task.title);
            if (matcher) {
              taskMap.set(matcher.name, task.id);
            }
          }
        }

        const total = calendar.length;
        const ramadanOffset = plan.ramadanOffset ?? 0;
        let count = 0;

        for (let i = 0; i < total; i++) {
          const calendarIndex = Math.max(0, Math.min(i + ramadanOffset, total - 1));
          const dayData = calendar[calendarIndex];
          const dayNumber = i + 1;
          const rows: { taskId: string; dayNumber: number; time: string; duration: number }[] = [];

          for (const matcher of matchers) {
            const taskId = taskMap.get(matcher.name);
            if (taskId) {
              let time = formatTime(dayData.timings[matcher.key]);
              if (matcher.offset) time = addMinutes(time, matcher.offset);
              rows.push({
                taskId,
                dayNumber,
                time,
                duration: matcher.name.includes("التراويح") ? 60 : 20
              });
            }
          }

          await scheduleTasksBatch(rows);
          count += rows.length;
          emit({ step: i + 1, total, day: dayNumber });
        }

        emit({ done: true, syncedCount: count });
      } catch (err) {
        console.error("[SYNC_PRAYERS_ERROR]", err);
        emit({ error: "حدث خطأ أثناء مزامنة أوقات الصلاة" });
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
