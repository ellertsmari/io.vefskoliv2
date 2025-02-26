"use client";

import { useState, useRef, useEffect } from "react";
import { SearchIcon, Bell } from "assets/Icons";
import {
  HeaderContainer,
  LeftSection,
  RightSection,
  IconButton,
  NotificationDropdown,
} from "./style";
import { useSession } from "next-auth/react";
import { Profile } from "components/profile/profile"; // Adjust the path as needed

export const Header: React.FC = () => {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  const userName = session?.user?.name || "User"; // Fallback to "User" if name is unavailable

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    console.log("Searching for:", searchQuery);
    setShowSearch(false);
  };

  return (
    <HeaderContainer>
      {}
      <LeftSection>
        <h1>Hi, {userName}</h1>
        <p>Let’s finish your task today!</p>
      </LeftSection>

      {}
      <RightSection>
        {}
        <div style={{ position: "relative" }}>
          <IconButton
            onClick={() => setShowNotifications(true)}
            aria-label="Notifications"
          >
            <Bell />
          </IconButton>
          {showNotifications && (
            <NotificationDropdown>
              <p>No new notifications</p>
              {}
            </NotificationDropdown>
          )}
        </div>

        {}
        <IconButton as="div">
          <Profile session={session} />
        </IconButton>
      </RightSection>
    </HeaderContainer>
  );
};
