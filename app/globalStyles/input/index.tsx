"use client";
import styled from "styled-components";
import { Wrapper, Label, ReusableInput, ReusableTextarea } from "./style";

type InputProps = {
  label: string;
  id: string;
  [props: string]: any; // To accept any other prop like placeholder, value, etc.
};

const Input = ({ label, id, ...props }: InputProps) => {
  return (
    <Wrapper>
      <Label htmlFor={id}>{label}</Label>
      {props.type === "textarea" ? (
        <ReusableTextarea id={id} {...props} />
      ) : (
        <ReusableInput id={id} {...props} />
      )}
    </Wrapper>
  );
};

export const ErrorMessage = styled.p`
  color: var(--error-failure-100);
  font-size: 14px;
`;

export default Input;
