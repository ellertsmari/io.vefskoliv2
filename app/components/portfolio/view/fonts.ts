import { DM_Serif_Display, Inter, Roboto_Mono } from "next/font/google";

/* The monospace font from the portfolio design (tabs, buttons, small labels).
   Loaded only on portfolio pages, not across the whole LMS. */
export const portfolioMono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--portfolio-mono",
});

/* The name and headline in the hero. */
export const portfolioSans = Inter({
  subsets: ["latin"],
  variable: "--portfolio-sans",
});

/* The tagline in the hero. */
export const portfolioSerif = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400", // this font only has one weight
  variable: "--portfolio-serif",
});
