"use client";

import { startTransition, useActionState, useRef, useTransition } from "react";
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

    startTransition(() => {
      if (formRef.current !== null)
        return formAction(new FormData(formRef.current));
    });
  };

  const handleGoToRegister = (event: any) => {
    event.preventDefault();
    setSelectedForm("register");
  };

  return (
    <FullScreenWrapper>
      
      <Form ref={formRef}>
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
