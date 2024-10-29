"use client";

import { use, useActionState, useEffect, useRef } from "react";
import { signUp } from "../utils/serverActions";
import DefaultButton from "../globalStyles/buttons/default";
import Input, { ErrorMessage } from "../globalStyles/input";
import {
  Container,
  Form,
  Logo,
  Wrapper,
  InputWrapper,
  ButtonWrapper,
  SuccessToast,
  ErrorToast,
} from "../login/style";
import LogoSvg from "../../public/logo.svg";

export default function RegisterForm({
  setSelectedForm,
}: {
  setSelectedForm: (form: "login" | "register") => void;
}) {
  const [state, formAction, isPending] = useActionState(signUp, undefined);

  const formRef = useRef<HTMLFormElement>(null);

  const handleRegister = async (event: React.FormEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (formRef.current) {
      formAction(new FormData(formRef.current));
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
  }, [state?.success]);

  return (
    <Container>
      <Form ref={formRef}>
        <Logo src={LogoSvg} alt="logo" />
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
        <Wrapper>
          <InputWrapper>
            <div>
              <Input
                id="firstName"
                type="text"
                name="firstName"
                label="First Name"
                required
                aria-disabled={isPending || state?.success}
                disabled={isPending || state?.success}
              />
              {state?.errors?.firstName && !isPending && (
                <ErrorMessage>{state?.errors.firstName[0]}</ErrorMessage>
              )}
            </div>
            <div>
              <Input
                id="lastName"
                type="text"
                name="lastName"
                label="Last Name"
                required
                aria-disabled={isPending || state?.success}
                disabled={isPending || state?.success}
              />
              {state?.errors?.lastName && (
                <ErrorMessage>{state?.errors.lastName[0]}</ErrorMessage>
              )}
            </div>
            <div>
              <Input
                id="email"
                type="email"
                name="email"
                label="Email"
                required
                aria-disabled={isPending || state?.success}
                disabled={isPending || state?.success}
              />
              {state?.errors?.email && (
                <ErrorMessage>{state?.errors.email[0]}</ErrorMessage>
              )}
            </div>
            <div>
              <Input
                id="password"
                type="password"
                name="password"
                label="Password"
                aria-disabled={isPending || state?.success}
                disabled={isPending || state?.success}
                required
              />
              {state?.errors?.password && (
                <ErrorMessage>{state?.errors.password[0]}</ErrorMessage>
              )}
            </div>
          </InputWrapper>
          <ButtonWrapper>
            <DefaultButton
              style="outlined"
              onClick={handleGoToLogin}
              aria-disabled={isPending}
              disabled={isPending}
            >
              CANCEL
            </DefaultButton>
            <DefaultButton
              style="default"
              aria-disabled={isPending || state?.success}
              disabled={isPending || state?.success}
              onClick={handleRegister}
            >
              REGISTER
            </DefaultButton>
          </ButtonWrapper>
        </Wrapper>
      </Form>
    </Container>
  );
}
