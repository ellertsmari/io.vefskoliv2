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
import { useSession } from "../providers/SessionProvider";

export default function LoginForm() {
  const session = useSession();

  const [errorMessage, formAction, isPending] = useActionState(
    authenticate,
    undefined
  );

  const formRef = useRef(null);

  const onLogin = (event: any) => {
    event.preventDefault();
    if (formRef.current) {
      formAction(new FormData(formRef.current));
    }
  };

  return !session?.user ? (
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
            <DefaultButton style="outlined">REGISTER</DefaultButton>
            <DefaultButton
              style="default"
              aria-disabled={isPending}
              onClick={onLogin}
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
  ) : null;
}
