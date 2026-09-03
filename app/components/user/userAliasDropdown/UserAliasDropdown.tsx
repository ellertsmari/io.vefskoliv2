"use client";

import { useState, useEffect, useMemo, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Session } from "next-auth";
import { getAllUsers, setAlias, clearAlias } from "serverActions/userAlias";
import { hasTeacherPermissions } from "utils/userUtils";
import { Avatar } from "UIcomponents/avatar/Avatar";
import { EyeIcon, ChevronIcon, ExitIcon } from "assets/Icons";
import {
  DropdownContainer,
  Pill,
  PillButton,
  PillName,
  PillIcon,
  PillChevron,
  PillDivider,
  ExitAliasButton,
  DropdownContent,
  DropdownLabel,
  SearchInput,
  UserList,
  DropdownItem,
  ItemText,
  ItemName,
  ItemMeta,
  ItemBadge,
  EmptyMessage,
} from "./style";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface UserAliasDropdownProps {
  session: Session | null;
}

/** Above this, scanning the list is slower than typing a name. */
const SEARCH_THRESHOLD = 8;

export const UserAliasDropdown = ({ session }: UserAliasDropdownProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  // Switching runs as a transition so the button can show a pending state
  // and the page only updates once the new session has rendered.
  const [switching, startSwitch] = useTransition();

  const isTeacher = hasTeacherPermissions(session);
  const isAliased = session?.user?.isAliased;
  const currentUser = session?.user;

  useEffect(() => {
    if (isTeacher && isOpen) {
      loadUsers();
    }
  }, [isTeacher, isOpen]);

  // A top-bar dropdown that only closes on select traps the page, so close on
  // an outside click or Escape like any other menu.
  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const result = await getAllUsers();
      if (result.success) {
        setUsers(result.data);
      } else {
        console.error("Failed to load users:", result.message);
      }
    } catch (error) {
      console.error("Failed to load users:", error);
    } finally {
      setLoading(false);
    }
  };

  // Setting or clearing the alias cookie makes the server re-render the
  // current route inside the action response. A full `location.reload()`
  // here used to cut that stream off mid-flight, which the browser reported
  // as "Error in input stream" before the reload finished the job anyway.
  // Refreshing inside the same transition waits for the render instead.
  const switchTo = (
    action: () => Promise<{ success: boolean; message?: string }>,
    failure: string
  ) => {
    setError(null);
    startSwitch(async () => {
      try {
        const result = await action();
        if (!result.success) {
          setError(result.message ?? failure);
          setIsOpen(true);
          return;
        }
        setIsOpen(false);
        router.refresh();
      } catch (cause) {
        console.error(failure, cause);
        setError(failure);
        setIsOpen(true);
      }
    });
  };

  const handleUserSelect = (userId: string) =>
    switchTo(() => setAlias(userId), "Could not switch view");

  const handleClearAlias = () =>
    switchTo(clearAlias, "Could not leave the student view");

  const filteredUsers = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return users;
    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(needle) ||
        user.email.toLowerCase().includes(needle)
    );
  }, [users, query]);

  if (!isTeacher) {
    return null;
  }

  return (
    <DropdownContainer ref={containerRef}>
      <Pill $active={!!isAliased}>
        <PillButton
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={loading || switching}
          aria-expanded={isOpen}
          aria-haspopup="menu"
          aria-busy={switching}
        >
          <PillIcon>
            <EyeIcon />
          </PillIcon>
          {switching ? (
            "Switching view…"
          ) : isAliased ? (
            <>
              Viewing as <PillName>{currentUser?.name}</PillName>
            </>
          ) : (
            "View as user"
          )}
          <PillChevron $open={isOpen}>
            <ChevronIcon />
          </PillChevron>
        </PillButton>

        {isAliased && (
          <>
            <PillDivider />
            <ExitAliasButton
              type="button"
              onClick={handleClearAlias}
              disabled={loading || switching}
              title="Exit student view"
              aria-label="Exit student view"
            >
              <PillIcon>
                <ExitIcon color="currentColor" />
              </PillIcon>
            </ExitAliasButton>
          </>
        )}
      </Pill>

      {isOpen && (
        <DropdownContent role="menu">
          <DropdownLabel>View as</DropdownLabel>

          {error && <EmptyMessage role="alert">{error}</EmptyMessage>}

          {users.length > SEARCH_THRESHOLD && (
            <SearchInput
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or email"
              aria-label="Search users"
            />
          )}

          {loading ? (
            <EmptyMessage>Loading users…</EmptyMessage>
          ) : filteredUsers.length === 0 ? (
            <EmptyMessage>No users found</EmptyMessage>
          ) : (
            <UserList>
              {filteredUsers.map((user) => {
                const isCurrent = user.id === currentUser?.id;
                return (
                  <DropdownItem
                    key={user.id}
                    type="button"
                    role="menuitem"
                    $current={isCurrent}
                    disabled={isCurrent || switching}
                    onClick={() => handleUserSelect(user.id)}
                  >
                    <Avatar name={user.name} size={28} />
                    <ItemText>
                      <ItemName>{user.name}</ItemName>
                      <ItemMeta>
                        {user.email} · {user.role}
                      </ItemMeta>
                    </ItemText>
                    {isCurrent && <ItemBadge>Current</ItemBadge>}
                  </DropdownItem>
                );
              })}
            </UserList>
          )}
        </DropdownContent>
      )}
    </DropdownContainer>
  );
};
