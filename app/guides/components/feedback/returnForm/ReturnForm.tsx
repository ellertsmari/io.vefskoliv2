"use client";
import Modal from "UIcomponents/modal/modal";
import Button from "globalStyles/buttons/default";

import { startTransition, useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ReturnFormData, returnGuide } from "serverActions/returnGuide";
import { Form } from "globalStyles/globalStyles";
import { Input } from "UIcomponents/input/Input";
import { ImageUploadField } from "UIcomponents/imageUpload/ImageUploadField";
import { useLocalState } from "utils/hooks/useStorage";
import { LoadingSpinner } from "UIcomponents/states/States";
import { RETURN_FIELDS, linkWarning } from "utils/returnFields";
import type { Discipline } from "utils/guideTaxonomy";
import {
  SuccessPanel,
  SuccessHeading,
  SuccessText,
  FormIntro,
} from "./style.ReturnSuccess";

type FormProps = {
  guideId: string;
  /** Decides what the two links are called and what they are checked against. */
  discipline?: Discipline;
  /**
   * Prefilled as the project title. The guide's idea is only an idea — a
   * student may hand in something they built for another reason, as long as
   * it covers the guide's goals — so the field stays editable.
   */
  defaultTitle?: string;
  /** Set when a return already exists; the form says so. */
  returningAgain?: boolean;
  /** Shown as a button on the success panel; absent means no button. */
  onDone?: () => void;
};

export const ReturnForm = (props: FormProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <Modal
      modalTrigger={<Button style="default">RETURN</Button>}
      modalContent={
        <FormContent {...props} onDone={() => setIsModalOpen(false)} />
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
export const InlineReturnForm = (props: FormProps) => <FormContent {...props} />;

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
  discipline = "code",
  defaultTitle,
  returningAgain = false,
  onDone,
}: FormProps) => {
  // localStorage, not sessionStorage: a closed tab used to take the half
  // written return with it.
  const [formData, setFormData, loading] = useLocalState<ReturnFormData>(
    `returnForm-${guideId}`,
    null
  );
  const [state, formAction, isPending] = useActionState(returnGuide, undefined);
  const router = useRouter();
  const fields = RETURN_FIELDS[discipline];

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
          {returningAgain
            ? "Your new return replaces the old one in the review queue, and classmates will be assigned to review it."
            : "Your project is now in the review queue, and classmates will be assigned to review it."}
        </SuccessText>
        <SuccessText>
          <strong>What happens next:</strong> to complete this guide you also
          need to review classmates&apos; projects — a bell will appear on this
          guide&apos;s card when one is ready for you. Once your reviews are in
          and your project has been reviewed, you&apos;ll see your result here.
        </SuccessText>
        {onDone && (
          <Button style="default" onClick={onDone}>
            GOT IT
          </Button>
        )}
      </SuccessPanel>
    );
  }

  // The idea's title is only a starting point; an empty string means the
  // student cleared it on purpose, so only an untouched draft gets the default.
  const projectName = formData?.projectName ?? defaultTitle ?? "";

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Normalize URL fields (and reflect it in the form so the student sees
    // exactly what was submitted).
    const normalized = {
      ...formData,
      projectUrl: normalizeUrl(formData?.projectUrl),
      liveVersion: normalizeUrl(formData?.liveVersion),
      projectName,
      // a blob URL from ImageUploadField — already absolute, no normalization
      pictureUrl: formData?.pictureUrl,
    };
    setFormData(normalized);
    startTransition(() => {
      formAction({ ...normalized, guideId });
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, projectName, [e.target.name]: e.target.value });
  };

  // Extract errors from state (only present when success is false)
  const errors = state && !state.success ? state.errors : undefined;

  return (
    <Form onSubmit={handleSubmit}>
        {returningAgain && (
          <FormIntro>
            Returning again. Reviews are given on your latest return, so this
            one replaces the previous one in the queue.
          </FormIntro>
        )}
        <Input
          id={"projectUrl"}
          type={"text"}
          name={"projectUrl"}
          label={fields.projectUrl.label}
          placeholder={fields.projectUrl.placeholder}
          hint={fields.projectUrl.hint}
          warning={linkWarning(discipline, "projectUrl", formData?.projectUrl ?? "")}
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
          label={fields.liveVersion.label}
          placeholder={fields.liveVersion.placeholder}
          hint={fields.liveVersion.hint}
          warning={linkWarning(discipline, "liveVersion", formData?.liveVersion ?? "")}
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
            setFormData({ ...formData, projectName, pictureUrl: value })
          }
          disabled={isPending}
        />
        <Input
          id={"projectName"}
          type={"text"}
          name={"projectName"}
          label={"Project title"}
          hint={
            defaultTitle
              ? "Prefilled from the guide's idea. Change it if you are handing in something of your own — anything that meets the guide's goals counts."
              : undefined
          }
          value={projectName}
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
          hint="What you built and what a reviewer should look at first."
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
