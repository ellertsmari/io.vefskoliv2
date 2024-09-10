import { ModalProvider } from "./ModalProvider";
import { ModalTrigger } from "./ModalTrigger";
import { ButtonHTMLAttributes, ReactElement } from "react";
import { ModalContent } from "./ModalContent";

type Props = {
  modalTrigger: ReactElement<ButtonHTMLAttributes<HTMLButtonElement>, string>;
  modalContent: React.ReactNode;
  hideExitButton?: boolean;
  state?: [boolean, React.Dispatch<React.SetStateAction<boolean>>];
};
const Modal = ({
  modalTrigger,
  modalContent,
  hideExitButton = false,
  state,
}: Props) => {
  return (
    <ModalProvider state={state}>
      <ModalTrigger trigger={modalTrigger} />
      <ModalContent content={modalContent} hideExitButton={hideExitButton} />
    </ModalProvider>
  );
};

export default Modal;
