"use client";

import MDEditor from "@uiw/react-md-editor";
import rehypeSanitize from "rehype-sanitize";
import React from "react";
import { MarkdownWrapper } from "./style";

type MarkdownReaderProps = {
  children: string;
};

// react-markdown-preview (backing MDEditor.Markdown) always runs rehype-raw, so
// raw HTML pasted into a review/return comment becomes real elements. A block
// element (e.g. a stray <p>) then nests inside react-markdown's auto-generated
// paragraph, producing `<p>` inside `<p>` — invalid HTML that crashes hydration.
// Rendering paragraphs as <div> removes that nesting risk while keeping the
// markdown layout; rehype-sanitize still strips dangerous HTML/attributes.
const markdownComponents = {
  p: (props: React.ComponentPropsWithoutRef<"div">) => (
    <div style={{ marginBottom: "16px" }} {...props} />
  ),
};

const MarkdownReader = ({ children }: MarkdownReaderProps) => {
  return (
    <MarkdownWrapper data-color-mode="light">
      <MDEditor.Markdown
        source={children}
        rehypePlugins={[[rehypeSanitize]]}
        components={markdownComponents}
      />
    </MarkdownWrapper>
  );
};

export default MarkdownReader;
