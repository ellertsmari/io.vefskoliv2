"use client";

import { startTransition, useActionState, useRef } from "react";
import { authenticate } from "serverActions/authenticate";
import { Input } from "UIcomponents/input/Input";
import DefaultButton from "globalStyles/buttons/default";
import {
  ErrorToast,
  FullScreenWrapper,
  ButtonWrapper,
  Form
} from "globalStyles/globalStyles";
import { Heading1 } from "globalStyles/text";

export function LoginForm({
  setSelectedForm,
}: {
  setSelectedForm: (form: "login" | "register") => void;
}) {
  const [errorMessage, formAction, isPending] = useActionState(
    authenticate,
    undefined
  );

  const formRef = useRef<HTMLFormElement>(null);

  const handleLogin = (event: any) => {
    event.preventDefault();

    if (!formRef.current) {
      console.error("Form ref is null");
      return;
    }

    try {
      startTransition(() => {
        if (formRef.current) {
          formAction(new FormData(formRef.current));
        }
      });
    } catch (error) {
      console.error("Error during login:", error);
    }
  };

  const handleGoToRegister = (event: any) => {
    event.preventDefault();
    setSelectedForm("register");
  };

  return (
    <FullScreenWrapper>
      
      <Form ref={formRef} action={formAction}>
      <Heading1>SIGN IN</Heading1>
        <Input id="email" type="email" name="email" label="EMAIL" required />
        <Input
          id="password"
          type="password"
          name="password"
          label="PASSWORD"
          required
        />
        <ButtonWrapper>
          <DefaultButton
            type="button"
            style="outlined"
            onClick={handleGoToRegister}
          >
            REGISTER
          </DefaultButton>
          <DefaultButton
            type="submit"
            style="default"
            aria-disabled={isPending}
            onClick={handleLogin}
          >
            LOGIN
          </DefaultButton>
        </ButtonWrapper>
        {errorMessage && (
          <>
            <ErrorToast>{errorMessage}</ErrorToast>
          </>
        )}
      </Form>
    </FullScreenWrapper>
  );
}
