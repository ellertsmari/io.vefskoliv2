import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "globalStyles/globals.css";
import StyledComponentsRegistry from "utils/registry";
import {
  LayoutGrid,
  SidebarContainer,
  HeaderContainer,
  Main,
} from "./globalStyles/layout";
import { auth } from "../auth";
import LoginPage from "pages/login/page";
import Nav from "components/navbar/Nav";
import FullCalendar from "components/calendar/Calendar";
import { Profile } from "components/profile/profile";
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

  const user = session?.user;

  return (
    <html lang="en">
      <body className={poppins.className}>
        <StyledComponentsRegistry>
          {user ? (
            <LayoutGrid>
              <SidebarContainer>
                {/* You can include your Sidebar here if needed */}
                <Nav />
              </SidebarContainer>
              <HeaderContainer>
                <Profile session={session} />
              </HeaderContainer>
              <Main>
                {/* Place the Cali (Calendar) component here */}
                <FullCalendar />
                {children}
              </Main>
            </LayoutGrid>
          ) : (
            <LoginPage />
          )}
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}
