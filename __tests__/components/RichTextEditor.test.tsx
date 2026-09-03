import { useState } from "react";
import { fireEvent, render } from "@testing-library/react";
import RichTextEditor from "UIcomponents/markdown/RichTextEditor";

/** The editor as the review form uses it: a controlled draft in state. */
const Harness = ({ initial = "" }: { initial?: string }) => {
  const [value, setValue] = useState(initial);
  return (
    <div>
      <RichTextEditor value={value} setValue={setValue} />
      <output data-testid="value">{value}</output>
    </div>
  );
};

const editorOf = (container: HTMLElement) =>
  container.querySelector("[contenteditable]") as HTMLDivElement;

describe("RichTextEditor", () => {
  it("shows a saved draft", () => {
    const { container } = render(<Harness initial="Nice **work**" />);

    expect(editorOf(container).innerHTML).toBe("Nice <strong>work</strong>");
  });

  it("does not rewrite the editor after the first keystroke into an empty draft", () => {
    const { container, getByTestId } = render(<Harness />);
    const editor = editorOf(container);

    // Type "T": the browser puts the text node in, then fires `input`.
    editor.textContent = "T";
    const typed = editor.firstChild;
    fireEvent.input(editor);

    expect(getByTestId("value").textContent).toBe("T");
    // Replacing innerHTML would have swapped the node and moved the caret to
    // the start, so the next letters landed in front: "That" became "hatT".
    expect(editor.firstChild).toBe(typed);

    editor.textContent = "That";
    fireEvent.input(editor);
    expect(getByTestId("value").textContent).toBe("That");
  });
});
