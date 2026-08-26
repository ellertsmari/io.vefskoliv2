"use client";
import Modal from "UIcomponents/modal/modal";
import Button from "globalStyles/buttons/default";

import { startTransition, useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ReturnFormData, returnGuide } from "serverActions/returnGuide";
import { Form } from "globalStyles/globalStyles";
import { Input } from "UIcomponents/input/Input";
import { ImageUploadField } from "UIcomponents/imageUpload/ImageUploadField";
import { useSessionState } from "utils/hooks/useStorage";
import { LoadingSpinner } from "UIcomponents/states/States";
import {
  SuccessPanel,
  SuccessHeading,
  SuccessText,
} from "./style.ReturnSuccess";

export const ReturnForm = ({ guideId }: { guideId: string }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <Modal
      modalTrigger={<Button style="default">RETURN</Button>}
      modalContent={
        <FormContent
          guideId={guideId}
          closeModal={() => setIsModalOpen(false)}
        />
      }
      state={[isModalOpen, setIsModalOpen]}
    />
  );
};

/**
 * The same form without the modal around it, for surfaces that already give it
 * a container of its own — the guide canvas, where a tile holding a single
 * button that opens a dialog was a lot of paper for very little.
 */
export const InlineReturnForm = ({ guideId }: { guideId: string }) => (
  <FormContent guideId={guideId} />
);

/**
 * Prepend https:// to URL-ish values typed without a scheme ("github.com/me/x").
 * Typo'd or bare URLs otherwise reach a CLASSMATE as a dead link when they're
 * assigned to review the return.
 */
const normalizeUrl = (value: string | undefined): string | undefined => {
  const trimmed = value?.trim();
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};

const FormContent = ({
  guideId,
  closeModal,
}: {
  guideId: string;
  /** Absent when the form is rendered inline — there is nothing to close. */
  closeModal?: () => void;
}) => {
  const [formData, setFormData, loading] = useSessionState<ReturnFormData>(
    `returnForm-${guideId}`
  );
  const [state, formAction, isPending] = useActionState(returnGuide, undefined);
  const router = useRouter();

  // On success: clear the draft and refresh server data so the guide's
  // status/card update behind the modal — WITHOUT a hard redirect that
  // teleports the student away mid-flow.
  useEffect(() => {
    if (state?.success) {
      setFormData(null);
      router.refresh();
    }
  }, [state?.success, setFormData, router]);

  if (!guideId) return null;
  if (loading) return <LoadingSpinner label="Opening the return form…" />;

  if (state?.success) {
    return (
      <SuccessPanel>
        <SuccessHeading>Return submitted! 🎉</SuccessHeading>
        <SuccessText>
          Your project is now in the review queue, and classmates will be
          assigned to review it.
        </SuccessText>
        <SuccessText>
          <strong>What happens next:</strong> to complete this guide you also
          need to review classmates&apos; projects — a bell will appear on this
          guide&apos;s card when one is ready for you. Once your reviews are in
          and your project has been reviewed, you&apos;ll see your result here.
        </SuccessText>
        {closeModal && (
          <Button style="default" onClick={closeModal}>
            GOT IT
          </Button>
        )}
      </SuccessPanel>
    );
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Normalize URL fields (and reflect it in the form so the student sees
    // exactly what was submitted).
    const normalized = {
      ...formData,
      projectUrl: normalizeUrl(formData?.projectUrl),
      liveVersion: normalizeUrl(formData?.liveVersion),
      // a blob URL from ImageUploadField — already absolute, no normalization
      pictureUrl: formData?.pictureUrl,
    };
    setFormData(normalized);
    startTransition(() => {
      formAction({ ...normalized, guideId });
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Extract errors from state (only present when success is false)
  const errors = state && !state.success ? state.errors : undefined;

  return (
    <Form onSubmit={handleSubmit}>
        <Input
          id={"projectUrl"}
          type={"text"}
          name={"projectUrl"}
          label={"Github or Figma URL"}
          required={true}
          disabled={isPending}
          value={formData?.projectUrl || ""}
          onChange={handleInputChange}
          error={
            errors?.projectUrl && !isPending
              ? errors.projectUrl[0]
              : undefined
          }
        />
        <Input
          id={"liveVersion"}
          type={"text"}
          name={"liveVersion"}
          label={"Live version or prototype(Figma)"}
          value={formData?.liveVersion || ""}
          onChange={handleInputChange}
          required={true}
          disabled={isPending}
          error={
            errors?.liveVersion && !isPending
              ? errors.liveVersion[0]
              : undefined
          }
        />
        <ImageUploadField
          id={"pictureUrl"}
          prefix="return-picture"
          label={"Image that suits your project (optional)"}
          value={formData?.pictureUrl || ""}
          onChange={(value) =>
            setFormData({ ...formData, pictureUrl: value })
          }
          disabled={isPending}
        />
        <Input
          id={"projectName"}
          type={"text"}
          name={"projectName"}
          label={"Project title"}
          value={formData?.projectName || ""}
          onChange={handleInputChange}
          required={true}
          disabled={isPending}
          error={
            errors?.projectName && !isPending
              ? errors.projectName[0]
              : undefined
          }
        />
        <Input
          id={"comment"}
          type={"textarea"}
          name={"comment"}
          label={"Short project description"}
          value={formData?.comment || ""}
          onChange={handleInputChange}
          required={true}
          disabled={isPending}
          error={
            errors?.comment && !isPending ? errors.comment[0] : undefined
          }
        />
      <Button style="default" type="submit">
        {isPending ? "SUBMITTING…" : "SUBMIT"}
      </Button>
    </Form>
  );
};
