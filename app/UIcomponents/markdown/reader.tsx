"use client";

import MDEditor from "@uiw/react-md-editor";
import { BlueSmallText } from "globalStyles/text";
import React from "react";

type MarkdownReaderProps = {
  children: string;
};

// MarkdownReader component used to display markdown content as plain text in the individual guides
const MarkdownReader = ({ children }: MarkdownReaderProps) => {
  return (
    <div
      data-color-mode="light"
      style={{
        wordBreak: "break-word",
        margin: "20px 0",
      }}
    >
      <MDEditor.Markdown
        style={{ color: "#2b5b76", backgroundColor: "transparent" }}
        source={children}
      ></MDEditor.Markdown>
    </div>
  );
};

export default MarkdownReader;
