import styled from "styled-components";

const deskTopWidth = "382px";
const mobileWidth = "264px";
const breakPoint = "600px";

export const ReusableInput = styled.input`

  width: ${mobileWidth};
  height: 40px;
  padding: 10px;
  border: 1px solid #2B5B76;
  border-radius: 8px;
  background-color: white;


  &:hover {
    background-color: #E8F1FC;

  }

  &:focus {
    outline: none;
    
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
  font-size: 12px;
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
