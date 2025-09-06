import type { Metadata } from "next";
import BackgroundImg from "app/assets/Background.svg"
import {
  LayoutGrid,
  TopbarContainer,
  Main,
  Background
} from "../globalStyles/layoutStyles";
import TopBar from "../components/navigation/TopBar";

export const metadata: Metadata = {
  title: "Guides - Vefskólinn LMS",
  description: "Browse our learning guides and resources.",
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





