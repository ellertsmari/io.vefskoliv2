"use client";

import { useActionState, useRef } from "react";
import { authenticate } from "../utils/actions";
import DefaultButton from "../globalStyles/buttons/default";
import Input from "../globalStyles/input";
import {
  Container,
  Form,
  Logo,
  Wrapper,
  InputWrapper,
  ButtonWrapper,
  Toast,
} from "../login/style";
import LogoSvg from "../../public/logo.svg";

export default function RegisterForm({
  setSelectedForm,
}: {
  setSelectedForm: (form: "login" | "register") => void;
}) {
  const [errorMessage, formAction, isPending] = useActionState(
    authenticate,
    undefined
  );

  const formRef = useRef(null);

  const handleRegister = (event: any) => {
    event.preventDefault();
    console.log("registering");
    //   if (formRef.current) {
    //     formAction(new FormData(formRef.current));
    //   }
  };

  const handleGoToLogin = (event: any) => {
    event.preventDefault();
    setSelectedForm("login");
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
            <DefaultButton style="outlined" onClick={handleGoToLogin}>
              BACK TO LOGIN
            </DefaultButton>
            <DefaultButton
              style="default"
              aria-disabled={isPending}
              onClick={handleRegister}
            >
              REGISTER
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
