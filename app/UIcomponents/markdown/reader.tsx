"use client";

import MDEditor from "@uiw/react-md-editor";
import rehypeSanitize from "rehype-sanitize";
import React from "react";

type MarkdownReaderProps = {
  children: string;
};

// MarkdownReader renders markdown content (including user-submitted review and
// return comments). rehype-sanitize strips dangerous HTML/attributes so one
// user's content can't inject scripts into another user's view.
const MarkdownReader = ({ children }: MarkdownReaderProps) => {
  return (
    <div data-color-mode="light" style={{ wordBreak: "break-word" }}>
      <MDEditor.Markdown source={children} rehypePlugins={[[rehypeSanitize]]} />
    </div>
  );
};

export default MarkdownReader;
