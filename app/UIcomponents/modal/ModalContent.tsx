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
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

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
  // document does not exist while rendering on the server, so the portal can
  // only be created after mount.
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

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

  if (!isModalOpen || !mounted) return null;

  /**
   * Rendered into <body>, not where it sits in the tree.
   *
   * The overlay is position: fixed, and a fixed element is positioned against
   * the nearest ancestor carrying a transform, filter or perspective — not the
   * viewport. Guide cards lift on hover, which leaves a transform on the card,
   * and a modal opened from one was landing hundreds of pixels off-screen with
   * the page scrolling sideways to reach it. A portal makes the overlay immune
   * to whatever any ancestor does to its own layout, stacking or overflow.
   */
  return createPortal(
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
    </ModalWrapper>,
    document.body
  );
};
