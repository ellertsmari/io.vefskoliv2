import { Plus_Jakarta_Sans } from "next/font/google";
import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#222222",
        foreground: "#FFEDE1",
        

      },
      fontFamily: {
        "plus-jakarta-sans": ["var(--font-plus-jakarta-sans)"],
      },
  },
},
  plugins: [],
} satisfies Config;
