"use client";

import { useActionState, useRef } from "react";
import { authenticate } from "../utils/actions";
import {
  Container,
  Form,
  InputWrapper,
  ButtonWrapper,
  Wrapper,
  Logo,
  Toast,
} from "../../app/login/style";
import Input from "../globalStyles/input";
import DefaultButton from "../globalStyles/buttons/default";
import LogoSvg from "../../public/logo.svg";

export default function LoginForm() {
  const [errorMessage, formAction, isPending] = useActionState(
    authenticate,
    undefined
  );

  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!formRef.current) return;
    formAction(new FormData(formRef.current));
  };

  const handleRegister = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    // handle register
    console.log("register");
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
            <DefaultButton style="outlined" onClick={handleRegister}>
              REGISTER
            </DefaultButton>
            <DefaultButton
              style="default"
              onClick={handleSubmit}
              aria-disabled={isPending}
            >
              LOGIN
            </DefaultButton>
          </ButtonWrapper>
        </Wrapper>
      </Form>
      {errorMessage && (
        <>
          <Toast>{errorMessage}</Toast>
        </>
      )}
    </Container>
  );
}
