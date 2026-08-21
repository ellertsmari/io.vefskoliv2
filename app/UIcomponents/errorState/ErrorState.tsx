"use client";

import {
  Actions,
  ErrorDigest,
  StateCode,
  StateMessage,
  StateTitle,
  StateWrapper,
} from "./style";

type Props = {
  /** Large display code, e.g. "404". Omitted for generic failures. */
  code?: string;
  title: string;
  message: React.ReactNode;
  /** Next's error digest, useful when reporting a problem. */
  digest?: string;
  /** Action buttons/links. */
  children?: React.ReactNode;
};

export const ErrorState = ({ code, title, message, digest, children }: Props) => (
  <StateWrapper>
    {code && <StateCode>{code}</StateCode>}
    <StateTitle>{title}</StateTitle>
    <StateMessage>{message}</StateMessage>
    {children && <Actions>{children}</Actions>}
    {digest && <ErrorDigest>Reference: {digest}</ErrorDigest>}
  </StateWrapper>
);

export default ErrorState;
