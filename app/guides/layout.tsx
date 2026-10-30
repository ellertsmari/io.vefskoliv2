import type { Metadata } from "next";
import { SCHOOL_NAME, SITE_NAME } from "constants/site";
import BackgroundImg from "app/assets/Background.svg"
import {
  LayoutGrid,
  TopbarContainer,
  Main,
  Background
} from "../globalStyles/layoutStyles";
import TopBar from "../components/navigation/TopBar";

export const metadata: Metadata = {
  title: `Guides · ${SITE_NAME} · ${SCHOOL_NAME}`,
  description: `Every assignment in the ${SITE_NAME} web development programme at ${SCHOOL_NAME}, module by module: HTML, CSS, JavaScript, React, TypeScript, back-end and UI/UX design.`,
};

export default function GuidesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // The root layout now handles the layout structure for public routes
  // This layout just passes through the children
  return <>{children}</>;
}





