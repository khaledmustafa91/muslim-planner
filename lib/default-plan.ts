export interface SeedSection {
  title: string;
  tasks: Array<{ title: string; type?: "regular" | "prayer" }>;
}

export const defaultSections: SeedSection[] = [
  {
    title: "الصلاة",
    tasks: [
      { title: "الفجر", type: "prayer" },
      { title: "الظهر", type: "prayer" },
      { title: "العصر", type: "prayer" },
      { title: "المغرب", type: "prayer" },
      { title: "العشاء", type: "prayer" }
    ]
  },
  {
    title: "أوراد وأذكار",
    tasks: [
      { title: "السنن الرواتب (12 ركعة)" },
      { title: "أذكار الصباح والمساء" },
      { title: "أذكار ما بعد الصلاة" },
      { title: "ورد ذكر (100 مرة)" }
    ]
  },
  {
    title: "القرآن",
    tasks: [
      { title: "قراءة الورد اليومي من القرآن" },
      { title: "تدبر وتفسير صفحة من القرآن" }
    ]
  },
  {
    title: "القيام والعبادات",
    tasks: [
      { title: "قيام الليل (التراويح)" },
      { title: "صدقة يومية" },
      { title: "إطعام صائم (أو كفارة)" }
    ]
  },
  {
    title: "السلوك اليومي",
    tasks: [
      { title: "ترك المسلسلات والبرامج" },
      { title: "صلة الرحم" },
    ]
  }
];
