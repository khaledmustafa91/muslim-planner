export interface RamadanDay {
  dayNumber: number; // 1-30
  hijriDay: string;
  gregorianDate: Date;
  formattedGregorian: string;
  dayName: string;
}

export function getRamadanDays(year: number, offset: number = 0): RamadanDay[] {
  // 1. Find the approximate start of Ramadan for the given Gregorian year
  // We'll iterate through the year to find the date that corresponds to 1 Ramadan
  let startDate = new Date(year, 0, 1); // Start with Jan 1st
  
  // Search for the start of Ramadan (this is a simplified search)
  for (let d = 0; d < 366; d++) {
    const date = new Date(year, 0, d + 1);
    const hijriMonth = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', {
      month: 'numeric'
    }).format(date);
    
    const hijriDay = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', {
      day: 'numeric'
    }).format(date);

    // Ramadan is the 9th month
    if (hijriMonth === "9" && hijriDay === "1") {
      startDate = date;
      break;
    }
  }

  // Apply the manual offset (moon sighting variation)
  startDate.setDate(startDate.getDate() + offset);

  const days: RamadanDay[] = [];
  const arLocale = 'ar-SA-u-ca-islamic-umalqura-nu-latn';
  const gregorianLocale = 'ar-EG'; // Using Arabic locale for Gregorian months too

  for (let i = 0; i < 30; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);

    days.push({
      dayNumber: i + 1,
      hijriDay: (i + 1).toLocaleString('ar-EG'), // Arabic numerals
      gregorianDate: currentDate,
      formattedGregorian: currentDate.toLocaleDateString(gregorianLocale, {
        day: 'numeric',
        month: 'short'
      }),
      dayName: currentDate.toLocaleDateString('ar-EG', { weekday: 'short' })
    });
  }

  return days;
}

export function formatTime12h(time24h: string): string {
  if (!time24h) return "";
  const [hours, minutes] = time24h.split(":").map(Number);
  const period = hours >= 12 ? "م" : "ص";
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes.toString().padStart(2, "0")} ${period}`;
}
