import { Wrapper } from "globalStyles/globalStyles";
import styled from "styled-components";

export const StyledLink = styled.a`
  text-decoration: none;
  color: inherit;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  width: 100%;
  height: 100%;

  &:hover {
    background-color: var(--primary-black-10);
  }
`;

export const Info = styled(Wrapper)`
  justify-content: space-between;
  height: 100%;
  align-items: center;
  gap: 0.5rem;
  padding: 1.25rem 0;
`;

export const GuideNr = styled.h2`
  font-size: 1rem;
  font-weight: 600;
  align-self: center;
`;

export const Name = styled.p`
  font-size: 0.75rem;
  width: 155px;
  font-weight: 400;
  text-align: center;
`;

export const GuideDescription = styled(Wrapper)`
  flex: 1;
  justify-content: center;
  text-align: center;
  align-items: flex-start;
  text-align: center;
`;