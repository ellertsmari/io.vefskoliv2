"use client";
import React, { ButtonHTMLAttributes, ReactElement } from "react";
import { useModal } from "./ModalProvider";

interface ModalTriggerProps {
  trigger: React.ReactElement;
}

export const ModalTrigger: React.FC<ModalTriggerProps> = ({ trigger }) => {
  const { setIsModalOpen } = useModal();

  return (
    <div
      onClick={() => setIsModalOpen(true)}
      style={{ width: "100%", height: "100%" }}
    >
      {trigger}
    </div>
  );
};
