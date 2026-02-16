import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        tajawal: ["var(--font-tajawal)", "sans-serif"],
        amiri: ["var(--font-amiri)", "serif"]
      }
    }
  },
  plugins: []
};

export default config;
