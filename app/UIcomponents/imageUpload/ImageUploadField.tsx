"use client";
import { useState } from "react";
import styled from "styled-components";
import { Wrapper, Label, ReusableInput, ErrorMessage } from "../input/style";
import {
  IMAGE_MAX_UPLOAD_BYTES,
  processImageFile,
} from "utils/imageUpload";

const Preview = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  align-items: flex-start;
`;

const PreviewImage = styled.img`
  max-width: 100%;
  max-height: 180px;
  border-radius: 8px;
  border: 1px solid var(--primary-black-10, #e9ecef);
  object-fit: cover;
`;

const RemoveButton = styled.button`
  border: 1px solid var(--primary-black-10, #e9ecef);
  background: white;
  border-radius: 6px;
  padding: 0.3rem 0.75rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--error-failure-100, #c92a2a);
  cursor: pointer;
`;

const Hint = styled.span`
  font-size: 0.75rem;
  color: var(--primary-black-60, #6c757d);
`;

type Props = {
  id: string;
  label: string;
  /** A stored image (data URL or legacy http(s) URL), or "" for none. */
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

/**
 * One image, uploaded from the computer: the file is downscaled in the
 * browser (see utils/imageUpload) and handed back as a data URL to store.
 */
export const ImageUploadField = ({
  id,
  label,
  value,
  onChange,
  disabled,
}: Props) => {
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    const result = await processImageFile(file);
    if (result.ok) {
      onChange(result.dataUrl);
    } else {
      setError(result.error);
    }
  };

  return (
    <Wrapper>
      <Label>
        {label}
        {value ? (
          <Preview>
            <PreviewImage src={value} alt="" />
            {!disabled && (
              <RemoveButton type="button" onClick={() => onChange("")}>
                Remove image
              </RemoveButton>
            )}
          </Preview>
        ) : (
          <ReusableInput
            id={id}
            type="file"
            accept="image/*"
            disabled={disabled}
            aria-describedby={error ? `${id}-error` : undefined}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              handleFile(file);
            }}
          />
        )}
      </Label>
      {!value && (
        <Hint>
          Big images are scaled down automatically — files up to{" "}
          {IMAGE_MAX_UPLOAD_BYTES / (1024 * 1024)} MB.
        </Hint>
      )}
      {error && <ErrorMessage id={`${id}-error`}>{error}</ErrorMessage>}
    </Wrapper>
  );
};
