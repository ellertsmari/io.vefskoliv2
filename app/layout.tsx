import type { Metadata } from "next";
import { Poppins } from "next/font/google";
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

const poppins = Poppins({ weight: "400", style: "normal", subsets: ["latin"] });
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
      <body className={poppins.className}>
        <StyledComponentsRegistry>
          <AnimatedBackground />
          {session?.user && (
            <LayoutGrid>
              <SidebarContainer>
                <Sidebar />
              </SidebarContainer>
              <NavbarContainer>
                <NavBar />
              </NavbarContainer>
              <Main>{children}</Main>
            </LayoutGrid>
          )}
          <LoginPage />
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}
