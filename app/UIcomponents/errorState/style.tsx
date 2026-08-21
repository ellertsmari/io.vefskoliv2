"use client";
import styled from "styled-components";
import Link from "next/link";
import { PageContainer } from "globalStyles/pageStyles";

/**
 * Built on the shared page frame so an error lines up with the left edge of
 * every other page's content, rather than floating in the middle.
 */
export const StateWrapper = styled(PageContainer)`
  align-items: flex-start;
  text-align: left;
  gap: 1rem;
`;

export const StateCode = styled.p`
  font-size: var(--text-display);
  font-weight: 700;
  line-height: 1;
  color: var(--theme-module3-30);
`;

export const StateTitle = styled.h1`
  font-size: var(--text-2xl);
  font-weight: 600;
  color: var(--primary-black-100);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0;
`;

export const StateMessage = styled.p`
  color: var(--primary-black-60);
  line-height: 1.5;
  /* Readable measure, without narrowing the frame itself. */
  max-width: 42rem;
`;

export const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 0.5rem;
`;

/**
 * A link styled as a button. A real <button> inside an <a> is invalid markup,
 * so navigation actions style the anchor instead of nesting the two.
 */
export const LinkButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 12px;
  border-radius: var(--radius-md);
  border: 1px solid var(--primary-black-100);
  background: transparent;
  color: var(--primary-black-100);
  font-size: var(--text-sm);
  text-decoration: none;
  transition: 0.15s ease-in-out;

  &:hover {
    background: var(--primary-black-10);
  }
`;

/** Shown only when a technical detail is worth surfacing. */
export const ErrorDigest = styled.code`
  font-size: var(--text-xs);
  color: var(--primary-black-30);
  word-break: break-all;
`;
