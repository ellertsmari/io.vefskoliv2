"use client";
import { useState } from "react";
import styled from "styled-components";
import { ErrorMessage } from "../input/style";
import { IMAGE_MAX_UPLOAD_BYTES } from "utils/imageUpload";
import { processImageFile } from "utils/imageUploadClient";

// Deliberately does NOT reuse UIcomponents/input's Wrapper/Label: those are
// pinned to a fixed 382px for the modal forms, which overflowed this field's
// grid column and ran each caption into the one beside it. Everything here is
// fluid and clamps to its container instead.
const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
  min-width: 0;
`;

const Title = styled.span`
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--primary-black-100);
`;

const Description = styled.span`
  font-size: var(--text-xs);
  color: var(--primary-black-60);
  line-height: 1.5;
  text-wrap: pretty;
`;

const FileInput = styled.input`
  width: 100%;
  min-width: 0;
  font-size: var(--text-xs);
  padding: 0.5rem;
  border: 1px dashed var(--primary-black-30);
  border-radius: var(--radius-md);
  background: var(--primary-black-5);
  cursor: pointer;

  &:hover:not(:disabled) {
    border-color: var(--primary-black-100);
  }

  &:disabled {
    cursor: default;
    opacity: 0.6;
  }
`;

const Preview = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: flex-start;
  width: 100%;
`;

const PreviewImage = styled.img`
  width: 100%;
  max-height: 180px;
  border-radius: var(--radius-md);
  border: 1px solid var(--primary-black-10);
  object-fit: cover;
`;

const RemoveButton = styled.button`
  border: 1px solid var(--primary-black-10);
  background: white;
  border-radius: var(--radius-md);
  padding: 0.3rem 0.75rem;
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--error-failure-100);
  cursor: pointer;

  &:hover:not(:disabled) {
    border-color: var(--error-failure-100);
  }

  &:disabled {
    cursor: default;
    opacity: 0.6;
  }
`;

const Hint = styled.span`
  font-size: var(--text-xs);
  color: var(--primary-black-60);
  line-height: 1.5;
`;

type Props = {
  id: string;
  /** Short name of the field, e.g. "Team photo". */
  label: string;
  /** The longer explanation of what belongs here and why. */
  description?: string;
  /** A stored image URL (or a legacy data URL), or "" for none. */
  value: string;
  onChange: (value: string) => void;
  /** Blocks picking a new image. Removal is governed separately. */
  disabled?: boolean;
  /**
   * Whether the existing image can be taken down. Defaults to `!disabled`, but
   * can be forced on where removal must keep working after editing is closed —
   * a picture of somebody has to stay removable for as long as it is published.
   */
  canRemove?: boolean;
  /** Groups the upload in the blob store, e.g. "team-photo". */
  prefix?: string;
};

/**
 * One image, uploaded from the computer: the file is downscaled in the browser
 * and sent straight to blob storage (see utils/imageUploadClient), and the URL
 * it returns is what gets stored on the record.
 *
 * The upload starts as soon as a file is picked, so the surrounding form saves
 * a short URL rather than carrying image bytes in its payload.
 */
export const ImageUploadField = ({
  id,
  label,
  description,
  value,
  onChange,
  disabled,
  canRemove,
  prefix,
}: Props) => {
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const removable = canRemove ?? !disabled;

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const result = await processImageFile(file, prefix);
      if (result.ok) {
        onChange(result.url);
      } else {
        setError(result.error);
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <Field>
      <Title as="label" htmlFor={id}>
        {label}
      </Title>
      {description && <Description>{description}</Description>}

      {value ? (
        <Preview>
          <PreviewImage src={value} alt="" />
          {removable && (
            <RemoveButton type="button" onClick={() => onChange("")}>
              Remove image
            </RemoveButton>
          )}
        </Preview>
      ) : (
        <FileInput
          id={id}
          type="file"
          accept="image/*"
          disabled={disabled || uploading}
          aria-describedby={error ? `${id}-error` : `${id}-hint`}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            handleFile(file);
          }}
        />
      )}

      {!value && (
        <Hint id={`${id}-hint`} role={uploading ? "status" : undefined}>
          {uploading
            ? "Uploading…"
            : `Big images are scaled down automatically — files up to ${IMAGE_MAX_UPLOAD_BYTES / (1024 * 1024)} MB.`}
        </Hint>
      )}
      {error && <ErrorMessage id={`${id}-error`}>{error}</ErrorMessage>}
    </Field>
  );
};
