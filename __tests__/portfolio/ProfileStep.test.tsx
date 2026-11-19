import { fireEvent, render, screen } from "@testing-library/react";
import ProfileStep from "../../app/LMS/portfolio/steps/ProfileStep";

jest.mock("UIcomponents/imageUpload/ImageUploadField", () => ({
  ImageUploadField: () => <div>Profile photo upload</div>,
}));

describe("Profile step", () => {
  test("shows fields and example information", () => {
    render(<ProfileStep />);
    expect(screen.getByLabelText("NAME")).toBeInTheDocument();
    expect(screen.getByLabelText("ROLE / HEADLINE")).toBeInTheDocument();
    expect(screen.getByLabelText("SECOND LINE")).toBeInTheDocument();
    expect(screen.getByLabelText(/ABOUT ME/)).toBeInTheDocument();
    expect(screen.getByLabelText("LOCATION")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "New language" })).toBeInTheDocument();
    expect(screen.getByText("Profile photo upload")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("checkbox", { name: /Open to internships/ }));
    expect(screen.getByLabelText("AVAILABLE FROM")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("checkbox", { name: /Open to internships/ }));
    expect(screen.queryByLabelText("AVAILABLE FROM")).not.toBeInTheDocument();
  });

  test("limits About Me to 1000 words", () => {
    render(<ProfileStep />);
    const about = screen.getByLabelText(/ABOUT ME/) as HTMLTextAreaElement;
    fireEvent.change(about, { target: { value: "hello ".repeat(1000) } });
    expect(screen.getByText("1000 / 1000 words")).toBeInTheDocument();
    fireEvent.change(about, { target: { value: "hello ".repeat(1001) } });
    expect(about.value.trim().split(/\s+/)).toHaveLength(1000);
  });

  test("adds and removes languages without duplicates", () => {
    render(<ProfileStep />);
    const language = screen.getByRole("textbox", { name: "New language" });
    const add = screen.getByRole("button", { name: "+ Add language" });
    fireEvent.change(language, { target: { value: "English" } });
    fireEvent.click(add);
    fireEvent.change(language, { target: { value: "english" } });
    fireEvent.click(add);
    expect(screen.getAllByRole("button", { name: "Remove language English" })).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Remove language English" }));
    expect(screen.queryByRole("button", { name: "Remove language English" })).not.toBeInTheDocument();
  });

  test("adds and removes skills without duplicates", () => {
    render(<ProfileStep />);
    const skill = screen.getByRole("textbox", { name: "New skill" });
    const add = screen.getByRole("button", { name: "+ Add" });
    fireEvent.change(skill, { target: { value: "React" } });
    fireEvent.click(add);
    fireEvent.change(skill, { target: { value: "react" } });
    fireEvent.click(add);
    expect(screen.getAllByRole("button", { name: "Remove React" })).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Remove React" }));
    expect(screen.queryByRole("button", { name: "Remove React" })).not.toBeInTheDocument();
  });
});
