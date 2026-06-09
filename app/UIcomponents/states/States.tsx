"use client";
import styled, { keyframes } from "styled-components";
import Link from "next/link";

/**
 * Shared loading / empty / error states so students see something intentional
 * instead of a blank flash, a raw error.message, or a bare <div>loading</div>.
 */

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

const SpinnerRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 1rem 0;
  color: #555;
`;

const SpinnerCircle = styled.span`
  width: 1.1rem;
  height: 1.1rem;
  flex: 0 0 auto;
  border-radius: 50%;
  border: 2px solid #ccc;
  border-top-color: #555;
  animation: ${spin} 0.8s linear infinite;
`;

export const LoadingSpinner = ({ label = "Loading…" }: { label?: string }) => (
  <SpinnerRow role="status" aria-live="polite">
    <SpinnerCircle aria-hidden="true" />
    <span>{label}</span>
  </SpinnerRow>
);

const StateContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  align-items: flex-start;
  padding: 2.5rem 1rem;
  max-width: 480px;
`;

const StateTitle = styled.h2`
  margin: 0;
  font-size: 1.4rem;
`;

const StateText = styled.p`
  margin: 0;
  line-height: 1.5;
  color: #444;
`;

export const EmptyState = ({
  title = "Nothing here yet",
  message,
}: {
  title?: string;
  message?: string;
}) => (
  <StateContainer>
    <StateTitle>{title}</StateTitle>
    {message && <StateText>{message}</StateText>}
  </StateContainer>
);

export const ErrorState = ({
  title = "Something went wrong",
  message = "We couldn't load this page. Please refresh — and if it keeps happening, let a teacher know.",
  backLink,
  backLabel = "Back to guides",
}: {
  title?: string;
  message?: string;
  backLink?: string;
  backLabel?: string;
}) => (
  <StateContainer>
    <StateTitle>{title}</StateTitle>
    <StateText>{message}</StateText>
    {backLink && <Link href={backLink}>← {backLabel}</Link>}
  </StateContainer>
);
