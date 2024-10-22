import MDEditor, { commands } from "@uiw/react-md-editor";
import React from "react";
import rehypeSanitize from "rehype-sanitize";
import "./editor.css";

type MarkdownReaderProps = {
  value: string;
  setValue: (string: string) => void;
  id?: string;
  type?: string;
  name?: string;
  label?: string;
  ref?: React.RefObject<HTMLFormElement>;
};
const MarkdownEditor = ({ value, setValue, ...props }: MarkdownReaderProps) => {
  return (
    <MDEditor
      value={value}
      onChange={(newValue?: string) => newValue && setValue(newValue)}
      previewOptions={{
        rehypePlugins: [[rehypeSanitize]],
      }}
      preview="edit"
      commands={[
        commands.title,
        commands.bold,
        commands.link,
        commands.unorderedListCommand,
        commands.orderedListCommand,
        commands.code,
      ]}
      extraCommands={[
        commands.help,
        commands.fullscreen,
        commands.codeEdit,
        commands.codeLive,
        commands.codePreview,
      ]}
      {...props}
    />
  );
};

export default MarkdownEditor;
