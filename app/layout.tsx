import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "globalStyles/globals.css";
import StyledComponentsRegistry from "utils/registry";

import { PageWrapper, NavWrapper } from "./style";

import Navbar from "components/navbar/navbar";
import Sidebar from "components/sidebar/sidebar";

import {
  LayoutGrid,
  Main,
  NavbarContainer,
  SidebarContainer,
} from "globalStyles/gridtemplate";

const poppins = Poppins({ weight: "400", style: "normal", subsets: ["latin"] });
// trigger rebuild

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body style={{ overflowX: "hidden" }}>
        <StyledComponentsRegistry>
          <LayoutGrid>
            <NavbarContainer>
              <Navbar></Navbar>
            </NavbarContainer>
            <SidebarContainer>
              <Sidebar />
            </SidebarContainer>
            <Main>{children}</Main>
          </LayoutGrid>
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}
