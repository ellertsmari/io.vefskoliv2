import styled from "styled-components";
import Image from "next/image";
import { Wrapper } from "globalStyles/globalStyles";

//Profile styles

export const ProfileWrapper = styled(Wrapper)`
  gap: 1rem;
`;

export const ImageWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  width: fit-content;
`;

export const ProfileImageContainer = styled.div`
  width: 58px;
  height: 58px;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
  transition: 0.3s ease-in-out;
  justify-content: center;
  align-items: center;
  display: flex;
  background-color: var(--primary-black-100);
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

export const ProfileInitials = styled.p`
  color: var(--primary-white)
`

//Modal styles

export const Logout = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: center;
`;

export const LogoutButton = styled.div`
  background: none;
  border: none;
  cursor: pointer;
  transition: 0.1s ease-in-out;
  align-self: center;
  flex-direction: row;
  display: flex;
  gap: 0.5rem;
  &:hover {
    filter: brightness(0.1);
  }
  align-items: center;
`;

export const LogoutIcon = styled(Image)`
  width: 17px;
  height: 18px;
`;

export const ProfileDetails = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
`;

export const AdditionalInfo = styled.p`
  font-size: 14px;
  text-transform: uppercase;
  color: var(--theme-module3-100);
`;

export const Form = styled.form`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
`;

export const ButtonWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 1rem;
`;
