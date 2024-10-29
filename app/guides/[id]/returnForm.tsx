"use client";
import Modal from "components/modal/modal";
import Button from "globalStyles/buttons/default";

import { Form } from "./style";
import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
} from "react";
import { returnGuide } from "../../utils/serverActions";
import { FormInputWithError } from "components/formInputWithError/FormInputWithError";

const ReturnForm = ({ guideId }: { guideId: string }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const ReturnButton = <Button style="default">RETURN</Button>;

  const FormContent = () => {
    const [state, formAction, isPending] = useActionState(
      returnGuide,
      undefined
    );

    const formRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
      if (state?.success) {
        // lazy way to force state update as we have no DB listeners setup yet
        window.location.replace("/guides");
      }
    }, [state?.success]);

    if (!guideId) return null;

    const handleSubmit = (event: React.FormEvent<HTMLButtonElement>) => {
      event.preventDefault();
      if (formRef.current) {
        const formData = new FormData(formRef.current);
        formData.append("guideId", guideId);
        startTransition(() => {
          formAction(formData);
        });
      }
    };

    return (
      <Form ref={formRef}>
        <FormInputWithError
          id={"projectUrl"}
          type={"text"}
          name={"projectUrl"}
          label={"Github or Figma URL"}
          required={true}
          disabled={isPending}
          error={
            state?.errors?.projectUrl && !isPending
              ? state.errors.projectUrl[0]
              : undefined
          }
        />
        <FormInputWithError
          id={"liveVersion"}
          type={"text"}
          name={"liveVersion"}
          label={"Live version or prototype(Figma)"}
          required={true}
          disabled={isPending}
          error={
            state?.errors?.liveVersion && !isPending
              ? state.errors.liveVersion[0]
              : undefined
          }
        />
        <FormInputWithError
          id={"imageOfProject"}
          type={"text"}
          name={"imageOfProject"}
          label={"Image that suits your project (optional)"}
          required={false}
          disabled={false}
        />
        <FormInputWithError
          id={"projectName"}
          type={"text"}
          name={"projectName"}
          label={"Project title"}
          required={true}
          disabled={false}
          error={
            state?.errors?.projectName && !isPending
              ? state.errors.projectName[0]
              : undefined
          }
        />
        <FormInputWithError
          id={"comment"}
          type={"textarea"}
          name={"comment"}
          label={"Short project description"}
          required={true}
          disabled={false}
          error={
            state?.errors?.comment && !isPending
              ? state.errors.comment[0]
              : undefined
          }
        />
        <Button style="default" onClick={handleSubmit}>
          SUBMIT
        </Button>
      </Form>
    );
  };

  return (
    <Modal
      modalTrigger={ReturnButton}
      modalContent={FormContent()}
      state={[isModalOpen, setIsModalOpen]}
    />
  );
};

export default ReturnForm;
