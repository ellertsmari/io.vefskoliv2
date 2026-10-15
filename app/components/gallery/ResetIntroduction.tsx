"use client";

import { useEffect, useState, type ReactNode } from "react";
import styled from "styled-components";
import { FiX } from "react-icons/fi";

const Anchor = styled.div`
  position: relative;
  display: flex;
  > button { width: 100%; }
`;

const Explanation = styled.div`
  position: absolute;
  right: 0;
  bottom: calc(100% + 12px);
  z-index: 20;
  width: min(300px, calc(100vw - 48px));
  box-sizing: border-box;
  padding: 18px 34px 18px 18px;
  border: 1px solid rgba(120, 100, 220, 0.3);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(16px);
  box-shadow: 0 8px 28px rgba(50, 35, 100, 0.16);
  color: var(--primary-black-100);
  font-family: "Source Sans 3", sans-serif;
  font-size: 14px;
  line-height: 1.5;
  p { margin: 6px 0 0; }
  &::after {
    content: "";
    position: absolute;
    right: 28px;
    bottom: -6px;
    width: 10px;
    height: 10px;
    background: rgba(255, 255, 255, 0.94);
    border-right: 1px solid rgba(120, 100, 220, 0.3);
    border-bottom: 1px solid rgba(120, 100, 220, 0.3);
    transform: rotate(45deg);
  }
`;

const Close = styled.button`
  position: absolute;
  top: 6px;
  right: 6px;
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: inherit;
  cursor: pointer;
  &:hover { background: rgba(120, 100, 220, 0.12); }
  &:focus-visible { outline: 2px solid var(--theme-module3-100); }
`;

export default function ResetIntroduction({
  userId, children,
}: { userId?: string; children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const storageKey = "gallery-reset-introduction-v2:" + (userId ?? "visitor");

  useEffect(() => {
    try { setVisible(localStorage.getItem(storageKey) !== "seen"); }
    catch { setVisible(true); }
  }, [storageKey]);

  const dismiss = () => {
    setVisible(false);
    try { localStorage.setItem(storageKey, "seen"); } catch {}
  };

  return (
    <Anchor data-gallery-layout="clear">
      {children}
      {visible && (
        <Explanation role="note" aria-label="How Clear all works">
          <Close type="button" aria-label="Close Clear all explanation" onClick={dismiss}>
            <FiX size={16} aria-hidden="true" />
          </Close>
          <strong>Clear all gallery controls</strong>
          <p>Clears search and all filters, and restores Most recommended sorting.</p>
        </Explanation>
      )}
    </Anchor>
  );
}
