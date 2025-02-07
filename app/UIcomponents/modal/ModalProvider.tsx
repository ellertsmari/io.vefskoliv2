"use client";
import React, {
  createContext,
  useState,
  useContext,
  SetStateAction,
  Dispatch,
} from "react";

const ModalContext = createContext({
  isModalOpen: false,
  setIsModalOpen: (() => {}) as Dispatch<SetStateAction<boolean>>,
});

interface ModalContextProps {
  children: React.ReactNode;
  state?: [boolean, Dispatch<SetStateAction<boolean>>];
}

export const ModalProvider = ({ children, state }: ModalContextProps) => {
  const [isModalOpenLocal, setIsModalOpenLocal] = useState<boolean>(false);

  const isModalOpen = state ? state[0] : isModalOpenLocal;
  const setIsModalOpen = state ? state[1] : setIsModalOpenLocal;

  return (
    <ModalContext.Provider value={{ isModalOpen, setIsModalOpen }}>
      {children}
    </ModalContext.Provider>
  );
};

export const useModal = () => useContext(ModalContext);
