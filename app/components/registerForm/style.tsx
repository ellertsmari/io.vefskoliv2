import styled from "styled-components";
import nextImage from "next/image";
import { Form as GlobalForm } from "globalStyles/globalStyles";

import Image from "next/image";
import { Wrapper } from "globalStyles/globalStyles";



export const Form = styled(GlobalForm)`
  padding: 2.5rem 3.5rem 2.5rem 3.5rem;
  border-radius: 0.5rem;
  background-color: var(--primary-white);
  gap: 2rem;
`;

export const Logo = styled(nextImage)`
  width: auto;
  height: 300px;
`;




//Profile styles

export const ProfileWrapper = styled(Wrapper)`
  gap: 1rem;
`;

export const ImageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: fit-content;
`;

export const ProfileImageContainer = styled.div`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
  transition: 0.3s ease-in-out;
  justify-content: center;
  display: flex;
  align-items: flex-end;
  background-color: var(--primary-white);
  &:hover {
    filter: brightness(0.8);
  }
`;

export const ProfileInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

export const ProfileImage = styled(Image)`
  width: 100px;
  height: auto;
`;

export const ProfileName = styled.h2`
  font-size: 24px;
  font-weight: 500;`
