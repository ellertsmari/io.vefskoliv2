import styled from "styled-components";

export const ModalWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  position: fixed;
  z-index: 10;
`;

export const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  background-color: var(--primary-white);
  max-width: 590px;
  max-width: 90vw;
  padding: 32px;
  gap: 32px;
  border-radius: 8px;
  border: 1px solid var(--theme-module3-100);
  z-index: 11;
  overflow-y: auto;
  max-height: 90vh;

  @media (min-width: 768px) {
    padding: 64px;
  }
`;

export const ButtonWrapper = styled.div`
  height: auto;
`;
