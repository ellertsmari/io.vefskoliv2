"use client";

import { useState } from "react";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import { Session } from "next-auth";

export default function LoginOrRegister({
  session,
}: {
  session: Session | null;
}) {
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
