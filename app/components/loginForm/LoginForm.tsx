"use client";

import { startTransition, useActionState, useRef, useTransition } from "react";
import { authenticate } from "serverActions/authenticate";
import { Form, Logo, TopLeftLogo } from "components/loginForm/style";
import { Input } from "UIcomponents/input/Input";
import DefaultButton from "globalStyles/buttons/default";
import LogoGif from "../../../public/loginGif.gif";
import LogoSvg from "../../../public/logo.svg";

import {
  ErrorToast,
  FullScreenWrapper,
  ButtonWrapper,
} from "globalStyles/globalStyles";
import Copyright from "components/copyrightText/copyrightText";

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
    <>
    <FullScreenWrapper>
    <TopLeftLogo src={LogoSvg} alt="logo" />
    <Form ref={formRef}>
        <Logo src={LogoGif} alt="logo" />
        <Input id="email" type="email" name="email" label="Email" required />
        <Input
          id="password"
          type="password"
          name="password"
          label="Password"
          required
        />
        
        <ButtonWrapper >
        <DefaultButton
            type="submit"
            style="default"
            aria-disabled={isPending}
            onClick={handleLogin}
          >
            Login
          </DefaultButton>
          <DefaultButton
            type="button"
            style="default"
            onClick={handleGoToRegister}
          >
            Register
          </DefaultButton>
        
        </ButtonWrapper>
        {errorMessage && (
          <>
            <ErrorToast>{errorMessage}</ErrorToast>
          </>
        )}
      </Form>
      
      <Copyright/>

    </FullScreenWrapper>
            </>
    
  );
}
