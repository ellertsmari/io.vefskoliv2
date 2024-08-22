import styled from "styled-components";
import Image from "next/image";

//Profile styles

export const ProfileWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
`;

export const ProfileImageContainer = styled.div`
  width: 142px;
  height: 142px;
  border-radius: 50%;
  overflow: hidden;
  border: 1px solid var(--theme-module3-100);
  cursor: pointer;
  transition: 0.3s ease-in-out;

  &:hover {
    filter: brightness(0.8);
  }
`;

export const ProfileImage = styled(Image)`
  width: 142px;
  height: auto;
  background-color: var(--primary-white);
`;

export const ProfileName = styled.h2`
  font-size: 24px;
  font-weight: 500;
`;

//Modal styles

export const ModalContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: var(--primary-white);
  width: 439px;
  padding: 16px;
  gap: 32px;
  border-radius: 8px;
  border: 1px solid var(--theme-module3-100);
  z-index: 11;
`;

export const ExitAndLogoutWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  align-items: center;
`;

export const LogoutButton = styled.div`
  background: none;
  border: none;
  cursor: pointer;
  transition: 0.1s ease-in-out;
  align-self: flex-end;
  flex-direction: row;
  display: flex;
  gap: 8px;
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
  align-items: center;
  gap: 8px;
`;

export const AdditionalInfo = styled.p`
  font-size: 14px;
  color: var(--theme-module3-100);
`;

export const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 32px;
`;

export const ButtonWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 16px;
`;
