"use client";

import MDEditor from "@uiw/react-md-editor";
import rehypeSanitize from "rehype-sanitize";
import React from "react";
import { MARKDOWN_H1_CLASS, MarkdownWrapper } from "./style";

type MarkdownProps<T extends keyof React.JSX.IntrinsicElements> =
  React.ComponentPropsWithoutRef<T> & { node?: unknown };

type MarkdownReaderProps = {
  children: string;
};

// react-markdown-preview (backing MDEditor.Markdown) always runs rehype-raw, so
// raw HTML pasted into a review/return comment becomes real elements. A block
// element (e.g. a stray <p>) then nests inside react-markdown's auto-generated
// paragraph, producing `<p>` inside `<p>` — invalid HTML that crashes hydration.
// Rendering paragraphs as <div> removes that nesting risk while keeping the
// markdown layout; rehype-sanitize still strips dangerous HTML/attributes.
//
// react-markdown also passes its syntax-tree `node`; spread onto an element it
// became the attribute node="[object Object]", so it is taken out first.
//
// A "# Heading" in the Markdown is rendered as an <h2>: the page already has
// its <h1> (the guide's title), and a second one tells crawlers and screen
// readers there are two topics. The class keeps the h1 look (see style.tsx).
const markdownComponents = {
  p: ({ node: _node, ...props }: MarkdownProps<"div">) => (
    <div style={{ marginBottom: "16px" }} {...props} />
  ),
  h1: ({ node: _node, className, ...props }: MarkdownProps<"h2">) => (
    <h2 className={[className, MARKDOWN_H1_CLASS].filter(Boolean).join(" ")} {...props} />
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
