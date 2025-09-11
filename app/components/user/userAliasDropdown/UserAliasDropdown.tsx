"use client";

import { useState, useEffect } from "react";
import { Session } from "next-auth";
import { getAllUsers, setAlias, clearAlias } from "serverActions/userAlias";
import { hasTeacherPermissions } from "utils/userUtils";
import {
  DropdownContainer,
  DropdownButton,
  DropdownContent,
  DropdownItem,
  AliasIndicator,
  ClearAliasButton
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

export const UserAliasDropdown = ({ session }: UserAliasDropdownProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const isTeacher = hasTeacherPermissions(session);
  const isAliased = session?.user?.isAliased;
  const currentUser = session?.user;

  useEffect(() => {
    if (isTeacher && isOpen) {
      loadUsers();
    }
  }, [isTeacher, isOpen]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const allUsers = await getAllUsers();
      setUsers(allUsers);
    } catch (error) {
      console.error("Failed to load users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = async (userId: string) => {
    try {
      setLoading(true);
      await setAlias(userId);
      setIsOpen(false);
      // Refresh the page to update the session
      window.location.reload();
    } catch (error) {
      console.error("Failed to set alias:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearAlias = async () => {
    try {
      setLoading(true);
      await clearAlias();
      setIsOpen(false);
      // Refresh the page to update the session
      window.location.reload();
    } catch (error) {
      console.error("Failed to clear alias:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isTeacher) {
    return null;
  }

  return (
    <DropdownContainer>
      {isAliased && (
        <>
          <AliasIndicator>
            Viewing as: {currentUser?.name}
          </AliasIndicator>
          <DropdownButton
            onClick={handleClearAlias}
            disabled={loading}
            style={{ background: 'var(--primary-red-100)', marginBottom: '8px' }}
          >
            Exit Student View
          </DropdownButton>
        </>
      )}
      <DropdownButton
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
      >
        {isAliased ? "Switch User" : "View As User"}
      </DropdownButton>
      
      {isOpen && (
        <DropdownContent>
          {isAliased && (
            <ClearAliasButton onClick={handleClearAlias} disabled={loading}>
              Return to Teacher View
            </ClearAliasButton>
          )}
          
          {loading ? (
            <DropdownItem>Loading users...</DropdownItem>
          ) : (
            users.map((user) => (
              <DropdownItem
                key={user.id}
                onClick={() => handleUserSelect(user.id)}
                style={{
                  opacity: user.id === currentUser?.id ? 0.5 : 1,
                  pointerEvents: user.id === currentUser?.id ? 'none' : 'auto'
                }}
              >
                <div>
                  <strong>{user.name}</strong>
                  <div style={{ fontSize: "12px", color: "#666" }}>
                    {user.email} ({user.role})
                  </div>
                </div>
              </DropdownItem>
            ))
          )}
        </DropdownContent>
      )}
    </DropdownContainer>
  );
};