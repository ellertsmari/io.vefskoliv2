"use client";
import ExitButton from "globalStyles/buttons/exit";
import { useModal } from "./ModalProvider";
import { ButtonWrapper, ContentWrapper, ModalWrapper } from "./style";
import { useEffect } from "react";

export const ModalContent = ({
  content,
  hideExitButton = false,
}: {
  content: React.ReactNode;
  hideExitButton?: boolean;
}) => {
  const { isModalOpen, setIsModalOpen } = useModal();

  useEffect(() => {
    if (typeof document !== "undefined") {
      const body = document.querySelector("body");
      if (isModalOpen) {
        body!.style.overflow = "hidden";
      } else {
        body!.style.overflow = "auto";
      }
    }
  }, [isModalOpen]);

  return (
    isModalOpen && (
      <ModalWrapper
        onClick={() => {
          setIsModalOpen(false);
        }}
        data-testid="modal-wrapper"
      >
        <ContentWrapper onClick={(e) => e.stopPropagation()}>
          {!hideExitButton && (
            <ButtonWrapper>
              <ExitButton onClick={() => setIsModalOpen(false)} />
            </ButtonWrapper>
          )}
          {content}
        </ContentWrapper>
      </ModalWrapper>
    )
  );
};
