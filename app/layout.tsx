import type { Metadata } from "next";
import { Poppins, Plus_Jakarta_Sans, Raleway } from "next/font/google";
import "globalStyles/globals.css";
import StyledComponentsRegistry from "utils/registry";
import AnimatedBackground from "globalStyles/animatedBackground";
import {
  LayoutGrid,
  SidebarContainer,
  NavbarContainer,
  Main,
} from "./globalStyles/layout";
import Sidebar from "./components/sidebar/sidebar";
import { auth } from "../auth";
import LoginPage from "pages/login/page";
import { NavBar } from "components/navigation/NavBar";
import { Header } from "components/header/Header";

const plusJarkaSans = Plus_Jakarta_Sans({
  weight: ["300", "400", "500", "600"],
  style: "normal",
  subsets: ["latin"],
});

// const poppins = Poppins({ weight: "400", style: "normal", subsets: ["latin"] });

// trigger rebuild
export const metadata: Metadata = {
  title: "Vefskólinn LMS",
  description:
    "This is a page for students of Vefskólinn to learn web development.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="en">
      <body className={plusJarkaSans.className}>
        <StyledComponentsRegistry>
          {session?.user ? (
            <LayoutGrid>
              <SidebarContainer>
                <Sidebar />
              </SidebarContainer>
              <Header></Header>
              <Main>{children}</Main>
            </LayoutGrid>
          ) : (
            <LoginPage />
          )}
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}
