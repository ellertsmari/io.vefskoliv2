"use client";

import { useState } from "react";
import { useSession } from "providers/SessionProvider";
import { RegisterForm } from "components/registerForm/RegisterForm";
import { LoginForm } from "components/loginForm/LoginForm";

export function LoginOrRegister() {
  const session = useSession();

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
