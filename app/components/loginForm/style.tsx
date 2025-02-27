import styled from "styled-components";
import nextImage from "next/image";
import { Form as GlobalForm, Wrapper } from "globalStyles/globalStyles";

export const Form = styled(GlobalForm)`
  padding: 2.5rem 3.5rem 2.5rem 3.5rem;
  border-radius: 0.5rem;
  background-color: var(--primary-white);
  gap: 1rem;
`;

export const Logo = styled(nextImage)`
  max-width: 380px;

  height: 280px;

  @media (max-width: 768px) {
    max-width: 300px;
  }
`;

export const TopLeftLogo = styled(nextImage)`
  position: absolute;
  top: 0px;
  left: 25px;
  width: auto;
  height: 150px;
  @media (max-width: 1024px) {
    height: 150px;
  }
`;
