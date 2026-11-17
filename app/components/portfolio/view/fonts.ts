import { Roboto_Mono } from "next/font/google";

/* The monospace font from the portfolio design (tabs, buttons, small labels).
   Loaded only on portfolio pages, not across the whole LMS. */
export const portfolioMono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--portfolio-mono",
});