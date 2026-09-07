"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import MarkdownReader from "UIcomponents/markdown/reader";
import { CollapseIcon } from "UIcomponents/guideTiles/icons";
import { ToolButton } from "UIcomponents/guideTiles/style";
import {
  FocusOverlay,
  FocusHeader,
  FocusTitle,
  FocusKbd,
  FocusPanes,
  FocusPane,
  FocusPaneLabel,
  FocusPreview,
  MarkdownEditorWrapper,
} from "./styles.EditGuideForm";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

/**
 * One long text on its own, full screen: the editor on the left and what a
 * student will see on the right. Nothing else on the page competes for
 * attention. Escape, or the button, goes back to the board with the text
 * exactly as it was left.
 */
export const FocusMode = ({
  title,
  value,
  onChange,
  onClose,
}: {
  title: string;
  value: string;
  onChange: (next: string) => void;
  onClose: () => void;
}) => {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    // The page behind must not scroll while this is up.
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <FocusOverlay role="dialog" aria-modal="true" aria-label={`Editing ${title}`}>
      <FocusHeader>
        <FocusTitle>{title}</FocusTitle>
        <FocusKbd>
          <kbd>Esc</kbd> back to the board
        </FocusKbd>
        <ToolButton type="button" ref={closeRef} onClick={onClose}>
          <CollapseIcon />
          Done
        </ToolButton>
      </FocusHeader>
      <FocusPanes>
        <FocusPane>
          <FocusPaneLabel>Markdown</FocusPaneLabel>
          <MarkdownEditorWrapper data-color-mode="light" style={{ flex: 1, minHeight: 0, display: "flex" }}>
            <MDEditor
              value={value}
              onChange={(next) => onChange(next || "")}
              preview="edit"
              height="100%"
              visibleDragbar={false}
              autoFocus
            />
          </MarkdownEditorWrapper>
        </FocusPane>
        <FocusPane>
          <FocusPaneLabel>What students see</FocusPaneLabel>
          <FocusPreview>
            <MarkdownReader>{value}</MarkdownReader>
          </FocusPreview>
        </FocusPane>
      </FocusPanes>
    </FocusOverlay>,
    document.body
  );
};
