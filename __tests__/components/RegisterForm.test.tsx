/**
 * @jest-environment jsdom
 */

import { render, fireEvent, waitFor } from "@testing-library/react";
import { RegisterForm } from "app/components/auth/registerForm/RegisterForm";
import { signUp } from "serverActions/signUp";

jest.mock("serverActions/signUp", () => ({
  signUp: jest.fn(),
}));

describe("RegisterForm", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders without crashing", () => {
    render(<RegisterForm setSelectedForm={() => {}} />);
  });

  it('calls setSelectedForm with "login" when "CANCEL" button is clicked', () => {
    const setSelectedForm = jest.fn();
    const { getByText } = render(
      <RegisterForm setSelectedForm={setSelectedForm} />
    );

    fireEvent.click(getByText("CANCEL"));

    expect(setSelectedForm).toHaveBeenCalledWith("login");
  });

  it('calls formAction when "REGISTER" button is clicked', async () => {
    const setSelectedForm = jest.fn();

    const firstName = "John";
    const lastName = "Doe";
    const email = "johndoe@example.com";
    const password = "password123";

    const { getByText, getByLabelText } = render(
      <RegisterForm setSelectedForm={setSelectedForm} />
    );

    fireEvent.change(getByLabelText("First Name"), {
      target: { value: firstName },
    });

    fireEvent.change(getByLabelText("Last Name"), {
      target: { value: lastName },
    });
    fireEvent.change(getByLabelText("Email"), {
      target: { value: email },
    });
    fireEvent.change(getByLabelText("Password"), {
      target: { value: password },
    });

    fireEvent.click(getByText("REGISTER"));

    const expectedFormData = new FormData();
    expectedFormData.append("firstName", firstName);
    expectedFormData.append("lastName", lastName);
    expectedFormData.append("email", email);
    expectedFormData.append("password", password);

    const formatDataObject = (formData: FormData) => {
      const obj: { [key: string]: string } = {};
      for (let [key, value] of formData.entries()) {
        obj[key] = value.toString();
      }
      return obj;
    };

    await waitFor(() => expect(signUp).toHaveBeenCalled());

    const actualFormData = (signUp as jest.Mock).mock.calls[0][1];

    expect(formatDataObject(actualFormData)).toEqual(
      formatDataObject(expectedFormData)
    );
  });
});
