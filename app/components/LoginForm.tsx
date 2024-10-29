"use client";

import { useActionState, useRef } from "react";
import { authenticate } from "../utils/serverActions";
import {
  Container,
  Form,
  InputWrapper,
  ButtonWrapper,
  Wrapper,
  Logo,
  ErrorToast,
} from "../../app/login/style";
import Input from "../globalStyles/input";
import DefaultButton from "../globalStyles/buttons/default";
import LogoSvg from "../../public/logo.svg";

export default function LoginForm({
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
    <Container>
      <Form ref={formRef}>
        <Logo src={LogoSvg} alt="logo" />
        <Wrapper>
          <InputWrapper>
            <Input
              id="email"
              type="email"
              name="email"
              label="Email"
              required
            />
            <Input
              id="password"
              type="password"
              name="password"
              label="Password"
              required
            />
          </InputWrapper>
          <ButtonWrapper>
            <DefaultButton style="outlined" onClick={handleGoToRegister}>
              REGISTER
            </DefaultButton>
            <DefaultButton
              style="default"
              aria-disabled={isPending}
              onClick={handleLogin}
            >
              LOGIN
            </DefaultButton>
          </ButtonWrapper>
        </Wrapper>
      </Form>
      {errorMessage && (
        <>
          <ErrorToast>{errorMessage}</ErrorToast>
        </>
      )}
    </Container>
  );
}
