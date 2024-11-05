import styled from "styled-components";

const deskTopWidth = "450px";
const mobileWidth = "240px";
const breakPoint = "600px";

export const ModalWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: flex-end;
  top: 0;
  left: 0;
  width: 100dvw;
  height: 100dvh;
  background-color: rgba(0, 0, 0, 0.5);
  position: fixed;
  z-index: 10;

  @media (min-width: ${deskTopWidth}) {
    align-items: center;
  }
`;

export const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  background-color: var(--primary-white);
  width: 100%;
  height: 95%;
  gap: 32px;
  border-radius: 8px;
  border: 1px solid var(--theme-module3-100);
  z-index: 11;
  overflow-y: auto;
  max-height: 90dvh;

  @media (min-width: ${deskTopWidth}) {
    height: auto;
    max-width: 90dvw;
    max-height: 90dvh;
  }

  @media (min-width: 768px) {
    padding: 64px;
  }
`;

export const ButtonWrapper = styled.div`
  height: auto;
  padding: 2rem 0 0 2rem;
  width: 100%;
`;

export const Content = styled.div`
  padding-top: 2rem;
  overflow-y: auto;
  padding: 0 2rem 2rem 2rem;
`;
