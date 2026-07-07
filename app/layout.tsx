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
} from "./globalStyles/layoutStyles";
import { auth } from "../auth";
import { NavBar } from "./components/navigation/NavBar/NavBar";
import TopBar from "./components/navigation/TopBar";
import { headers } from "next/headers";

const SourceSans3 = Source_Sans_3({ weight: "400", style: "normal", subsets: ["latin"] });

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
  const isLoggedIn = !!session?.user

  // Get the current pathname to determine if this is a public route
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || '';

  // Landing page (/) when not logged in should render without the LMS layout,
  // as do the external judge pages (/judge/<token> — judges have no account)
  // and the public project showcase.
  const isStandalonePage =
    (pathname === "/" && !isLoggedIn) ||
    pathname.startsWith("/judge") ||
    pathname.startsWith("/showcase");

  return (
    <html lang="en">
      <body className={SourceSans3.className}>
        <StyledComponentsRegistry>
          {isStandalonePage ? (
            // Standalone pages render without the LMS layout wrapper
            <>{children}</>
          ) : (
            // All other pages use the LMS layout
            <>
              <Background src={BackgroundImg} alt="Background image"/>
              <LayoutGrid>
                <TopbarContainer>
                  <TopBar showAvatar={isLoggedIn}/>
                </TopbarContainer>
                {isLoggedIn && (
                  <NavigationContainer>
                    <NavBar/>
                  </NavigationContainer>
                )}
                <Main style={!isLoggedIn ? {gridColumn: "1 / -1"} : {}}>{children}</Main>
              </LayoutGrid>
            </>
          )}
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}
