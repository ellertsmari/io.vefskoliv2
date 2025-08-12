import type { Metadata } from "next";
import { Source_Sans_3 } from "next/font/google";
import "globalStyles/globals.css";
import StyledComponentsRegistry from "utils/registry";
import BackgroundImg from "app/assets/Background.svg"
import {
  LayoutGrid,
  NavigationContainer,
  TopbarContainer,
  Main,
  Background
} from "./globalStyles/layout";
import { auth } from "../auth";
import LoginPage from "pages/login/page";
import { NavBar } from "components/navigation/NavBar";
import TopBar from "components/topBar";

const SourceSans3 = Source_Sans_3({ weight: "400", style: "normal", subsets: ["latin"] });
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
  const shouldShowAvatar = !!session?.user

  return (
    <html lang="en">
      <body className={SourceSans3.className}>
        <StyledComponentsRegistry>
          
          {session?.user ? (
            <>
            <Background src={BackgroundImg} alt="Background image"/>
            <LayoutGrid>
            <TopbarContainer>
                <TopBar showAvatar={shouldShowAvatar}/>
              </TopbarContainer>
              <NavigationContainer>
                <NavBar/>
              </NavigationContainer>
              <Main>{children}</Main>
            </LayoutGrid>
            </>
          ) : (
            <>
            <TopBar showAvatar={shouldShowAvatar}/>
            <LoginPage />
            </>
          )}
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}
