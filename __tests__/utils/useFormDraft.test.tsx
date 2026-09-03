import { useState } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { useFormDraft } from "utils/hooks/useStorage";
import { DraftNotice } from "UIcomponents/draftNotice/DraftNotice";

/** A one-field form the way the real ones use the hook. */
const Form = ({ draftKey = "test-form" }: { draftKey?: string | null }) => {
  const [text, setText] = useState("");
  const draft = useFormDraft(draftKey, { text }, (saved) => setText(saved.text));
  return (
    <div>
      <DraftNotice restored={draft.restored} onDiscard={draft.discard} />
      <input
        aria-label="Text"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button type="button" onClick={draft.clear}>
        Save
      </button>
    </div>
  );
};

const stored = () => window.localStorage.getItem("draft:test-form");

describe("useFormDraft", () => {
  beforeEach(() => window.localStorage.clear());

  it("writes what is typed and removes the draft when the form is back to its start", () => {
    render(<Form />);
    const input = screen.getByLabelText("Text");

    fireEvent.change(input, { target: { value: "hello" } });
    expect(stored()).toBe(JSON.stringify({ text: "hello" }));

    fireEvent.change(input, { target: { value: "" } });
    expect(stored()).toBeNull();
  });

  it("restores the draft on the next visit and says so", () => {
    window.localStorage.setItem("draft:test-form", JSON.stringify({ text: "kept" }));

    render(<Form />);

    expect((screen.getByLabelText("Text") as HTMLInputElement).value).toBe("kept");
    expect(screen.getByRole("status")).toBeDefined();
  });

  it("discards the draft back to the starting values", () => {
    window.localStorage.setItem("draft:test-form", JSON.stringify({ text: "kept" }));
    render(<Form />);

    fireEvent.click(screen.getByText("Discard it"));

    expect((screen.getByLabelText("Text") as HTMLInputElement).value).toBe("");
    expect(stored()).toBeNull();
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("forgets the draft once saved, and treats the saved values as the new start", () => {
    render(<Form />);
    const input = screen.getByLabelText("Text");
    fireEvent.change(input, { target: { value: "final" } });

    act(() => {
      fireEvent.click(screen.getByText("Save"));
    });

    expect(stored()).toBeNull();
    // Typing on from the saved value creates a fresh draft.
    fireEvent.change(input, { target: { value: "final!" } });
    expect(stored()).toBe(JSON.stringify({ text: "final!" }));
  });

  it("does nothing without a key", () => {
    render(<Form draftKey={null} />);
    fireEvent.change(screen.getByLabelText("Text"), { target: { value: "x" } });

    expect(window.localStorage.length).toBe(0);
  });

  it("shows no notice for an untouched form", () => {
    render(<Form />);
    expect(screen.queryByRole("status")).toBeNull();
    expect(stored()).toBeNull();
  });
});
