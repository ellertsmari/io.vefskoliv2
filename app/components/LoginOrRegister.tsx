"use client";

import { useState } from "react";
import { useSession } from "../providers/SessionProvider";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";

export default function LoginOrRegister() {
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
