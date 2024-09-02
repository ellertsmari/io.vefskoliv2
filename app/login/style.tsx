import styled from "styled-components";
import nextImage from "next/image";
import Input from "../globalStyles/input";

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100vw;
  height: 100vh;
`;

export const Form = styled.form`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 42px 65px 42px 65px;
  border-radius: 8px;
  border: 1px solid var(--theme-module3-100);
  background-color: var(--primary-white);
  gap: 48px;
`;

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 48px;
`;

export const InputWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 48px;
`;

export const ButtonWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`;

export const Logo = styled(nextImage)`
  width: 150px;
  height: 154px;
`;

const Toast = styled.div`
  padding: 16px;
  top: 100px;
  position: absolute;
  border-radius: 8px;
`;

export const ErrorToast = styled(Toast)`
  background-color: var(--error-failure-10);
  border: 1px solid var(--error-failure-100);
  color: var(--primary-black-100);
`;

export const SuccessToast = styled(Toast)`
  background-color: var(--error-success-10);
  border: 1px solid var(--error-success-100);
  color: var(--primary-black-100);
`;

export const ErrorInput = styled(Input)`
  border: 1px solid var(--error-failure-100);
`;

export const ErrorMessage = styled.p`
  color: var(--error-failure-100);
  font-size: 14px;
`;
