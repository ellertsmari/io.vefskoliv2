"use client";
import React, {
  createContext,
  useState,
  useContext,
  useMemo,
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

  const value = useMemo(
    () => ({ isModalOpen, setIsModalOpen }),
    [isModalOpen, setIsModalOpen]
  );

  return (
    <ModalContext.Provider value={value}>
      {children}
    </ModalContext.Provider>
  );
};

export const useModal = () => useContext(ModalContext);
