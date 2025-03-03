import { auth } from "auth";
import Nav from "components/navbar/Nav";
import { Profile } from "components/profile/profile";
import { HeaderContainer, LayoutGrid, SidebarContainer } from "globalStyles/layoutStyles";
import React from "react";

type Props = {
  children: React.ReactNode;
};



export default async function GuideLayout({ children }: Props) {
  const session = await auth();

const user = session?.user;
  return (
    <html lang="en">
      <body>
        <LayoutGrid>
        <HeaderContainer>
                <Profile session={session} />
              </HeaderContainer>
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
