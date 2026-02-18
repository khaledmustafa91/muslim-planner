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
      { title: "العشاء", type: "prayer" },
    ]
  },
  {
    title: "السنن والرواتب",
    tasks: []
  },
  {
    title: "أذكار",
    tasks: [
      { title: "أذكار الصباح" },
      { title: "أذكار المساء" }
    ]
  },
  {
    title: "القرآن",
    tasks: []
  },
  {
    title: "قيام الليل",
    tasks: [
      { title: "قيام الليل (التراويح)" },
    ]
  }
];
