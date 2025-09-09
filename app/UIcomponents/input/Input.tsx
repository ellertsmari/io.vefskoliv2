"use client";
import { Wrapper, Label, ReusableInput, ReusableTextarea, ErrorMessage } from "./style";

type InputProps = {
  label: string;
  id: string;
  [props: string]: any; // To accept any other prop like placeholder, value, etc.
  error?: string;
};

export const Input = ({ label, id, error, ...props }: InputProps) => {
  return (
    <Wrapper>
      <Label>
        {label}
        {props.type === "textarea" ? (
          <ReusableTextarea
            id={id}
            aria-describedby={error ? `${id}-error` : undefined}
            {...props}
          />
        ) : (
          <ReusableInput
            id={id}
            aria-describedby={error ? `${id}-error` : undefined}
            {...props}
          />
        )}
      </Label>
      {error && <ErrorMessage id={`${id}-error`}>{error}</ErrorMessage>}
    </Wrapper>
  );
};
