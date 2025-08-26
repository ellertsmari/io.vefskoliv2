"use client";
import styled from "styled-components";
import { Wrapper, Label, ReusableInput, ReusableTextarea } from "./style";
import { Paragraph } from "globalStyles/text";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
  error?: string;
  type?: "text" | "email" | "password" | "textarea" | "number" | "tel" | "url";
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  id: string;
  error?: string;
  type: "textarea";
}

type ComponentProps = InputProps | TextareaProps;

export const Input = ({ label, id, error, type = "text", ...props }: ComponentProps) => {
  return (
    <Wrapper>
      <Label>
        {label}
        {type === "textarea" ? (
          <ReusableTextarea
            id={id}
            aria-describedby={error ? `${id}-error` : undefined}
            {...(props as TextareaProps)}
          />
        ) : (
          <ReusableInput
            id={id}
            type={type}
            aria-describedby={error ? `${id}-error` : undefined}
            {...(props as InputProps)}
          />
        )}
      </Label>
      {error && <ErrorMessage id={`${id}-error`}>{error}</ErrorMessage>}
    </Wrapper>
  );
};

export const ErrorMessage = styled(Paragraph)`
  color: var(--error-failure-100);
  font-size: 14px;
`;
