"use client";

import { startTransition, useActionState, useEffect, useRef } from "react";
import { signUp } from "serverActions/signUp";
import DefaultButton from "../../globalStyles/buttons/default";
import { Input } from "UIcomponents/input/Input";
import {
  ButtonWrapper,
  ErrorToast,
  FullScreenWrapper,
  SuccessToast,
} from "globalStyles/globalStyles";
import { Form,   ProfileImage,
  ProfileImageContainer,
  ProfileName,
  ProfileWrapper,
  ImageWrapper, } from "./style";
import Copyright from "components/copyrightText/copyrightText";
import { DefaultUserIcon } from "assets/Icons";
import { TopLeftLogo } from "components/loginForm/style";
import LogoSvg from "../../../public/logo.svg";





const ProfilePicture = ({ url }: { url?: string | null | undefined }) => {
  return (
    <ProfileImageContainer>
      {url ? (
        <ProfileImage
          width={100}
          height={100}
          src={url}
          alt="student picture"
        />
      ) : (
        <DefaultUserIcon />
      )}
    </ProfileImageContainer>
  );
};




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
        if (formRef.current !== null)
          return formAction(new FormData(formRef.current));
      });
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

  
  return (
    <FullScreenWrapper>
      <TopLeftLogo src={LogoSvg} alt="logo" />

      <ImageWrapper>
        <ProfilePicture url={undefined} />
      </ImageWrapper>
           
      <Form ref={formRef}>

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
          label="First Name"
          required
          aria-disabled={isPending || state?.success}
          disabled={isPending || state?.success}
          error={
            state?.errors?.firstName && !isPending
              ? state?.errors.firstName[0]
              : undefined
          }
        />

        <Input
          id="lastName"
          type="text"
          name="lastName"
          label="Last Name"
          required
          aria-disabled={isPending || state?.success}
          disabled={isPending || state?.success}
          error={
            state?.errors?.lastName && !isPending
              ? state?.errors.lastName[0]
              : undefined
          }
        />
        <Input
          id="email"
          type="email"
          name="email"
          label="Email"
          required
          aria-disabled={isPending || state?.success}
          disabled={isPending || state?.success}
          error={
            state?.errors?.email && !isPending
              ? state?.errors.email[0]
              : undefined
          }
        />

        <Input
          id="password"
          type="password"
          name="password"
          label="Password"
          aria-disabled={isPending || state?.success}
          disabled={isPending || state?.success}
          required
          error={
            state?.errors?.password && !isPending
              ? state?.errors.password[0]
              : undefined
          }
        />

        <ButtonWrapper>
          <DefaultButton
            type="button"
            style="default"
            onClick={handleGoToLogin}
            aria-disabled={isPending}
            disabled={isPending}
          >
            Cancel
          </DefaultButton>
          <DefaultButton
            type="submit"
            style="default"
            aria-disabled={isPending || state?.success}
            disabled={isPending || state?.success}
            onClick={handleRegister}
          >
            Register
          </DefaultButton>
        </ButtonWrapper>
      </Form>
            <Copyright/>
      
    </FullScreenWrapper>
  );
}


