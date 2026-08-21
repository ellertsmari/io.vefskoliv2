"use client";
import ExitButton from "globalStyles/buttons/exit";
import { useModal } from "./ModalProvider";
import {
  ButtonWrapper,
  Content,
  ContentWrapper,
  ModalWrapper,
  type ModalSize,
} from "./style";
import { useEffect } from "react";

export const ModalContent = ({
  content,
  hideExitButton = false,
  size = "md",
}: {
  content: React.ReactNode;
  hideExitButton?: boolean;
  size?: ModalSize;
}) => {
  const { isModalOpen, setIsModalOpen } = useModal();

  useEffect(() => {
    if (!isModalOpen) return;

    document.body.style.overflow = "hidden";
    // Unlock on unmount as well as on close: the logout button lives inside the
    // profile modal, so navigating away leaves the modal mounted-then-removed
    // with `isModalOpen` still true — the next page was stuck unscrollable.
    return () => {
      document.body.style.overflow = "";
    };
  }, [isModalOpen]);

  return (
    isModalOpen && (
      <ModalWrapper
        onClick={() => {
          setIsModalOpen(false);
        }}
        data-testid="modal-wrapper"
      >
        <ContentWrapper $size={size} onClick={(e) => e.stopPropagation()}>
          {!hideExitButton && (
            <ButtonWrapper>
              <ExitButton onClick={() => setIsModalOpen(false)} />
            </ButtonWrapper>
          )}
          <Content>{content}</Content>
        </ContentWrapper>
      </ModalWrapper>
    )
  );
};
