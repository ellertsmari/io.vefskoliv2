"use client";
import {
  Wrapper,
  Label,
  ReusableInput,
  ReusableTextarea,
  ErrorMessage,
  HintMessage,
  WarningMessage,
} from "./style";

type InputProps = {
  label: string;
  id: string;
  [props: string]: any; // To accept any other prop like placeholder, value, etc.
  error?: string;
  /** How to fill the field in, shown under it from the start. */
  hint?: string;
  /** Something that looks off but does not block submitting. */
  warning?: string;
};

export const Input = ({ label, id, error, hint, warning, ...props }: InputProps) => {
  const describedBy =
    [
      error ? `${id}-error` : null,
      warning ? `${id}-warning` : null,
      hint ? `${id}-hint` : null,
    ]
      .filter(Boolean)
      .join(" ") || undefined;
  return (
    <Wrapper>
      <Label>
        {label}
        {props.type === "textarea" ? (
          <ReusableTextarea id={id} aria-describedby={describedBy} {...props} />
        ) : (
          <ReusableInput id={id} aria-describedby={describedBy} {...props} />
        )}
      </Label>
      {error && <ErrorMessage id={`${id}-error`}>{error}</ErrorMessage>}
      {!error && warning && (
        <WarningMessage id={`${id}-warning`} role="status">
          {warning}
        </WarningMessage>
      )}
      {hint && <HintMessage id={`${id}-hint`}>{hint}</HintMessage>}
    </Wrapper>
  );
};
