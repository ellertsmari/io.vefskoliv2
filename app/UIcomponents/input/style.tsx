import styled from "styled-components";

const deskTopWidth = "382px";
const mobileWidth = "240px";
const breakPoint = "600px";

export const ReusableInput = styled.input`
  width: ${mobileWidth};
  height: 32px;
  padding: 10px;
  border: 1px solid var(--primary-black-30);
  border-radius: 8px;
  transition: 0.15s ease-in-out;

  &:hover {
    border: 1px solid var(--primary-black-100);
  }

  &:focus {
    outline: none;
    border: 1px solid var(--primary-black-100);
  }

  @media (min-width: ${breakPoint}) {
    width: ${deskTopWidth};
  }
`;

export const ReusableTextarea = styled.textarea`
  width: ${mobileWidth};
  height: 200px;
  padding: 10px;
  border: 1px solid var(--primary-black-30);
  border-radius: 8px;

  &:hover {
    border: 1px solid var(--theme-module3-60);
  }

  &:focus {
    outline: none;
    border: 1px solid var(--theme-module3-100);
  }

  @media (min-width: ${breakPoint}) {
    width: ${deskTopWidth};
  }
`;

export const Label = styled.label`
  font-size: 14px;
  color: var(--primary-black-60);
  width: ${mobileWidth};

  @media (min-width: ${breakPoint}) {
    width: ${deskTopWidth};
  }
`;

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  max-width: fit-content;
`;
