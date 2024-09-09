"use client";
import React, { ButtonHTMLAttributes, ReactElement } from "react";
import { useModal } from "./ModalProvider";

interface ModalTriggerProps {
  trigger: ReactElement<ButtonHTMLAttributes<HTMLButtonElement>, string>;
}

export const ModalTrigger: React.FC<ModalTriggerProps> = ({ trigger }) => {
  const { setIsModalOpen } = useModal();

  return React.cloneElement(trigger, { onClick: () => setIsModalOpen(true) });
};
