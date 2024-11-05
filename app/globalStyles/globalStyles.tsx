import styled from "styled-components";
import { Button } from "./buttons/default/style";
import { BREAKPOINT_DESKTOP } from "./globalConstants";

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

export const Border = styled(Wrapper)`
  border: 1px solid var(--theme-module3-100);
  border-radius: 0.5rem;
`;

export const MaterialButton = styled(Button)`
  text-align: left;
  padding: 2px 0.5rem;
  white-space: nowrap;
`;

export const Form = styled.form`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
`;

export const FlexibleWrapper = styled(Wrapper)`
  @media (min-width: ${BREAKPOINT_DESKTOP}) {
    flex-direction: row;
  }
`;
