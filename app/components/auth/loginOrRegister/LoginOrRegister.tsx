"use client";

import { useState } from "react";

import { RegisterForm } from "../registerForm/RegisterForm";
import { LoginForm } from "../loginForm/LoginForm";
import { Session } from "next-auth";

export function LoginOrRegister({ session }: { session: Session | null }) {
  const [selectedForm, setSelectedForm] = useState<"login" | "register">(
    "login"
  );

  if (session) {
    return null;
  }

  return selectedForm === "register" ? (
    <RegisterForm setSelectedForm={setSelectedForm} />
  ) : (
    <LoginForm setSelectedForm={setSelectedForm} />
  );
}
