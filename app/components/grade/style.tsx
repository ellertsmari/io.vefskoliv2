import { Button } from "globalStyles/buttons/default/style";
import styled from "styled-components";

export const SubmitButton = styled(Button)`
  margin-top: 1rem;
  width: 50%;
`;

export const ButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  width: 100%;
`;

export const GradeContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 0.5rem;
`;

export const GradeMeaningDisplay = styled.div`
  margin-bottom: 8px;
  padding: 8px 12px;
  background-color: var(--primary-black-10);
  border-radius: 6px;
  font-size: 14px;
  color: var(--primary-black-60);
  border: 1px solid var(--primary-black-30);
  line-height: 1.4;
`;
