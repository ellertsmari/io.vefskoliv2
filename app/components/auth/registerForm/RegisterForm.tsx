"use client";

import { startTransition, useActionState, useEffect, useRef } from "react";
import { signUp } from "serverActions/signUp";
import DefaultButton from "../../../globalStyles/buttons/default";
import { Input } from "UIcomponents/input/Input";
import {
  ButtonWrapper,
  ErrorToast,
  FullScreenWrapper,
  SuccessToast,
  Form
} from "globalStyles/globalStyles";
import { Heading1 } from "globalStyles/text";

export function RegisterForm({
  setSelectedForm,
}: {
  setSelectedForm: (form: "login" | "register") => void;
}) {
  const [state, formAction, isPending] = useActionState(signUp, undefined);

  const formRef = useRef<HTMLFormElement>(null);

  const handleRegister = async (event: React.FormEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (formRef.current) {
      startTransition(() => {
        formAction(new FormData(formRef.current ?? undefined));
      })
    }
  };

  const handleGoToLogin = (event: any) => {
    event.preventDefault();
    setSelectedForm("login");
  };

  useEffect(() => {
    if (state?.success) {
      setTimeout(() => {
        setSelectedForm("login");
      }, 3000);
    }
  }, [state?.success, setSelectedForm]);

  // Extract errors from state (only present when success is false)
  const errors = state && !state.success ? state.errors : undefined;

  return (
    <FullScreenWrapper>
      <Form ref={formRef}>
        <Heading1>SIGN UP</Heading1>
        {state?.success === false && typeof state.message === "string" && (
          <>
            <ErrorToast>{state.message}</ErrorToast>
          </>
        )}
        {state?.success && (
          <>
            <SuccessToast>{state.message}</SuccessToast>
          </>
        )}
        <Input
          id="firstName"
          type="text"
          name="firstName"
          label="FIRTS NAME"
          required
          aria-disabled={isPending || state?.success}
          disabled={isPending || state?.success}
          error={
            errors?.firstName && !isPending ? errors.firstName[0] : undefined
          }
        />

        <Input
          id="lastName"
          type="text"
          name="lastName"
          label="LAST NAME"
          required
          aria-disabled={isPending || state?.success}
          disabled={isPending || state?.success}
          error={
            errors?.lastName && !isPending ? errors.lastName[0] : undefined
          }
        />
        <Input
          id="email"
          type="email"
          name="email"
          label="EMAIL"
          required
          aria-disabled={isPending || state?.success}
          disabled={isPending || state?.success}
          error={errors?.email && !isPending ? errors.email[0] : undefined}
        />

        <Input
          id="password"
          type="password"
          name="password"
          label="PASSWORD"
          aria-disabled={isPending || state?.success}
          disabled={isPending || state?.success}
          required
          error={
            errors?.password && !isPending ? errors.password[0] : undefined
          }
        />

        <ButtonWrapper>
          <DefaultButton
            type="button"
            style="outlined"
            onClick={handleGoToLogin}
            aria-disabled={isPending}
            disabled={isPending}
          >
            CANCEL
          </DefaultButton>
          <DefaultButton
            type="submit"
            style="default"
            aria-disabled={isPending || state?.success}
            disabled={isPending || state?.success}
            onClick={handleRegister}
          >
            REGISTER
          </DefaultButton>
        </ButtonWrapper>
      </Form>
    </FullScreenWrapper>
  );
}
