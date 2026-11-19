import { fireEvent, render, screen } from "@testing-library/react";
import ContactStep from "../../app/LMS/portfolio/steps/ContactStep";

describe("Contact step", () => {
  test("has optional email, LinkedIn and GitHub fields", () => {
    render(<ContactStep />);

    const email = screen.getByRole("textbox", { name: /EMAIL/ }) as HTMLInputElement;
    const linkedin = screen.getByRole("textbox", { name: "LINKEDIN" }) as HTMLInputElement;
    const github = screen.getByRole("textbox", { name: "GITHUB" }) as HTMLInputElement;

    expect(email.type).toBe("email");
    expect(email.required).toBe(false);
    expect(linkedin.type).toBe("url");
    expect(github.type).toBe("url");
    expect(email.value).toBe("");
  });

  test("allows students to enter and change their contact links", () => {
    render(<ContactStep />);
    const email = screen.getByRole("textbox", { name: /EMAIL/ }) as HTMLInputElement;
    const linkedin = screen.getByRole("textbox", { name: "LINKEDIN" }) as HTMLInputElement;
    const github = screen.getByRole("textbox", { name: "GITHUB" }) as HTMLInputElement;

    fireEvent.change(email, { target: { value: "student@example.com" } });
    fireEvent.change(linkedin, { target: { value: "https://www.linkedin.com/in/student" } });
    fireEvent.change(github, { target: { value: "https://github.com/student" } });

    expect(email.value).toBe("student@example.com");
    expect(linkedin.value).toBe("https://www.linkedin.com/in/student");
    expect(github.value).toBe("https://github.com/student");

    fireEvent.change(email, { target: { value: "" } });
    expect(email.value).toBe("");
  });
});
