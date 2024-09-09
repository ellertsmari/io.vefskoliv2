"use client";
import ExitButton from "globalStyles/buttons/exit";
import { useModal } from "./ModalProvider";
import { ButtonWrapper, ContentWrapper, ModalWrapper } from "./style";
import { useEffect } from "react";

const body = document.querySelector("body");

export const ModalContent = ({
  content,
  hideExitButton = false,
}: {
  content: React.ReactNode;
  hideExitButton?: boolean;
}) => {
  const { isModalOpen, setIsModalOpen } = useModal();

  useEffect(() => {
    if (isModalOpen) {
      body!.style.overflow = "hidden";
    } else {
      body!.style.overflow = "auto";
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
        <div onClick={(e) => e.stopPropagation()}>
          <ContentWrapper>
            {!hideExitButton && (
              <ButtonWrapper>
                <ExitButton onClick={() => setIsModalOpen(false)} />
              </ButtonWrapper>
            )}
            {content}
          </ContentWrapper>
        </div>
      </ModalWrapper>
    )
  );
};
