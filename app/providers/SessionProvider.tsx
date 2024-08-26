"use client";
import React from "react";
import { Session } from "next-auth";

interface SessionProviderProps {
  children: React.ReactNode | null;
  session: Session | null;
}

export const SessionContext = React.createContext<Session | null>(null);

export function SessionProvider({ children, session }: SessionProviderProps) {
  return (
    <SessionContext.Provider value={session}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return React.useContext(SessionContext);
}
