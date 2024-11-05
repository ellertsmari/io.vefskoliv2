"use client";

import { useActionState, useRef } from "react";
import { authenticate } from "serverActions/authenticate";
import { Form, Logo } from "components/loginForm/style";
import { Input } from "UIcomponents/input/Input";
import DefaultButton from "globalStyles/buttons/default";
import LogoSvg from "../../../public/logo.svg";
import {
  ErrorToast,
  FullScreenWrapper,
  ButtonWrapper,
} from "globalStyles/globalStyles";

export function LoginForm({
  setSelectedForm,
}: {
  setSelectedForm: (form: "login" | "register") => void;
}) {
  const [errorMessage, formAction, isPending] = useActionState(
    authenticate,
    undefined
  );

  const formRef = useRef(null);

  const handleLogin = (event: any) => {
    event.preventDefault();
    if (formRef.current) {
      formAction(new FormData(formRef.current));
    }
  };

  const handleGoToRegister = (event: any) => {
    event.preventDefault();
    setSelectedForm("register");
  };

  return (
    <FullScreenWrapper>
      <Form ref={formRef}>
        <Logo src={LogoSvg} alt="logo" />
        <Input id="email" type="email" name="email" label="Email" required />
        <Input
          id="password"
          type="password"
          name="password"
          label="Password"
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
