import { ModalProvider } from "./ModalProvider";
import { ModalTrigger } from "./ModalTrigger";
import { ModalContent } from "./ModalContent";
import type { ModalSize } from "./style";

type Props = {
  modalTrigger: React.ReactElement;
  modalContent: React.ReactNode;
  hideExitButton?: boolean;
  /** Width of the dialog. Defaults to "md" — widen it only for content that needs it. */
  size?: ModalSize;
  state?: [boolean, React.Dispatch<React.SetStateAction<boolean>>];
};
const Modal = ({
  modalTrigger,
  modalContent,
  hideExitButton = false,
  size = "md",
  state,
}: Props) => {
  return (
    <ModalProvider state={state}>
      <ModalTrigger trigger={modalTrigger} />
      <ModalContent
        content={modalContent}
        hideExitButton={hideExitButton}
        size={size}
      />
    </ModalProvider>
  );
};

export default Modal;
