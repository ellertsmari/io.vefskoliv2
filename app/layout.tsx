import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "globalStyles/globals.css";
import StyledComponentsRegistry from "utils/registry";

import Navbar from "components/navbar/navbar";
import Sidebar from "components/sidebar/sidebar";

import {
  LayoutGrid,
  Main,
  NavbarContainer,
  SidebarContainer,
} from "globalStyles/gridtemplate";
import ClientLayout from "components/ClientLayout";

const poppins = Poppins({ weight: "400", style: "normal", subsets: ["latin"] });

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ overflowX: "hidden" }}>
        <StyledComponentsRegistry>
          <ClientLayout>{children} </ClientLayout>

          <SidebarContainer></SidebarContainer>
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}
