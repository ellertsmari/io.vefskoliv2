import styled from "styled-components";
import Image from "next/image";
import { Wrapper } from "globalStyles/globalStyles";

// Profile styles

export const ProfileWrapper = styled(Wrapper)`
  gap: 1rem;
`;

export const ImageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: fit-content;
  margin: 0; /* Remove extra spacing for header alignment */
  padding: 0; /* Remove extra padding for header alignment */
`;

export const ProfileImageContainer = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  border: 1px solid var(--theme-module3-100);
  cursor: pointer;
  transition: 0.3s ease-in-out;
  justify-content: center;
  display: flex;
  align-items: center; /* Center image vertically for header alignment */
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
  width: 32px; /* Match container size for header alignment */
  height: 32px; /* Ensure consistent 32x32px size */
  object-fit: cover; /* Fill container without distortion */
`;

export const ProfileName = styled.h2`
  font-size: 24px;
  font-weight: 500;
  display: none; /* Hide in header; shown in modal via ProfileInfo */
`;

// Modal styles

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
