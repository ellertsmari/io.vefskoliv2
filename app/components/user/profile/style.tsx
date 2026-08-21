import styled from "styled-components";
import { Wrapper } from "globalStyles/globalStyles";

//Profile styles

export const ProfileWrapper = styled(Wrapper)`
  align-items: center;
  gap: 1.5rem;
`;

/**
 * Row in the top bar (name beside the avatar); stacked inside the profile
 * modal, where the avatar reads as the header and the name sits under it.
 */
export const ImageWrapper = styled.div<{ $stacked?: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ $stacked }) => ($stacked ? "0.5rem" : "8px")};
  width: fit-content;
  /* The top-bar picture is a modal trigger. */
  cursor: ${({ $stacked }) => ($stacked ? "default" : "pointer")};
  ${({ $stacked }) =>
    $stacked &&
    `
    flex-direction: column-reverse;
    text-align: center;
  `}
`;

export const ProfileInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.125rem;
`;

//Modal styles

export const LogoutButton = styled.button`
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  transition: 0.1s ease-in-out;
  display: inline-flex;
  flex-direction: row;
  align-items: center;
  gap: 0.375rem;
  font-size: var(--text-xs);
  letter-spacing: 0.04em;
  color: var(--primary-black-60);

  /* Keep the glyph optically centred against the cap height of the label. */
  svg {
    display: block;
    flex-shrink: 0;
  }

  &:hover {
    color: var(--primary-black-100);
  }
`;

export const ProfileDetails = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
`;

export const AdditionalInfo = styled.p`
  font-size: var(--text-sm);
  text-transform: uppercase;
  color: var(--theme-module3-100);
  line-height: 1.3;
`;

export const UserEmail = styled(AdditionalInfo)`
  text-transform: none;
  color: var(--primary-black-60);
`;

export const Form = styled.form`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  width: 100%;
`;

export const ButtonWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 0.75rem;
`;
