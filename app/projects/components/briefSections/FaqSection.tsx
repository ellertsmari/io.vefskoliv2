"use client";

import styled from "styled-components";
import { Icon } from "@iconify/react";
import { ResolvedBrief } from "constants/projectBrief";
import { rich } from "../Rich";
import { ease } from "./shared";

/* ---------------------------------- FAQ ---------------------------------- */

const Faq = styled.div`
  display: grid;
  gap: 0.6rem;

  details {
    background: var(--b-surface);
    border: 1px solid var(--b-line);
    border-radius: var(--radius-md);
    padding: 0 1.1rem;
    transition: border-color 0.25s ease;
  }

  details[open] {
    border-color: color-mix(in srgb, var(--b-accent) 50%, var(--b-line));
  }

  summary {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: center;
    padding: 0.95rem 0;
    font-weight: 700;
    cursor: pointer;
    list-style: none;
  }

  summary::-webkit-details-marker {
    display: none;
  }

  summary svg {
    flex: none;
    color: var(--b-accent);
    transition: transform 0.3s ${ease};
  }

  details[open] summary svg {
    transform: rotate(45deg);
  }

  details p {
    margin: 0 0 1rem;
    color: var(--b-muted);
  }
`;

export const FaqSection = ({ brief }: { brief: ResolvedBrief }) => (
  <Faq data-stagger="60">
    {brief.faq.map((item) => (
      <details key={item.question}>
        <summary>
          {item.question}
          <Icon icon="mdi:plus" aria-hidden />
        </summary>
        <p>{rich(item.answer)}</p>
      </details>
    ))}
  </Faq>
);
