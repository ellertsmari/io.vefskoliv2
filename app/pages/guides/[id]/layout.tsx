import Nav from "components/navbar/Nav";
import { LayoutGrid, SidebarContainer } from "globalStyles/layoutStyles";
import React from "react";
import StyledComponentsRegistry from "utils/registry";

type Props = {
  children: React.ReactNode;
};
export default function GuideLayout({ children }: Props) {
  return (
    <html lang="en">
      <body>
        <LayoutGrid>
          <SidebarContainer>
            {/* You can include your Sidebar here if needed */}
            <Nav />
          </SidebarContainer>
          {children}
        </LayoutGrid>
      </body>
    </html>
  );
}
