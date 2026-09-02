/**
 * @jest-environment node
 */
import { signUp } from "serverActions/signUp";
import bcrypt from "bcrypt";
import { User } from "models/user";

// signUp opens a database connection before it does anything else, and this
// suite mocks every query it makes (User.create) — so the connection is pure
// overhead. Unmocked it dials MONGODB_CONNECTION for real: fine locally where
// .env.local points at a live database, but in CI there is nothing listening
// and the connector's 30s serverSelectionTimeoutMS blows straight through
// Jest's 5s limit. That is what made these tests fail on CI only.
jest.mock("serverActions/mongoose-connector", () => ({
  connectToDatabase: jest.fn().mockResolvedValue(undefined),
}));

// Registration must never sign the new account in: it is pending until a
// teacher approves it. If signUp ever imports these again, this mock makes
// the call visible instead of letting it silently create a session.
jest.mock("../../auth", () => ({
  getUser: jest.fn(),
  signIn: jest.fn(),
}));
import { signIn } from "../../auth";

describe("signUp", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  const firstName = "John";
  const lastName = "Doe";
  const email = "john.doe@example.com";
  const password = "password123";
  const hashedPassword = "hashedPassword123";

  const validForm = () => {
    const formData = new FormData();
    formData.append("firstName", firstName);
    formData.append("lastName", lastName);
    formData.append("email", email);
    formData.append("password", password);
    return formData;
  };

  it("creates a PENDING account and does not sign the user in", async () => {
    bcrypt.hash = jest.fn().mockResolvedValueOnce(hashedPassword);
    User.create = jest.fn();

    const result = await signUp(undefined, validForm());

    expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
    expect(User.create).toHaveBeenCalledWith({
      name: firstName + " " + lastName,
      email,
      password: hashedPassword,
      role: "user",
      status: "pending",
    });
    expect(signIn).not.toHaveBeenCalled();
    expect(result.success).toBe(true);
    expect(result.message).toMatch(/teacher needs to approve/i);
  });

  it("should return an error if form validation fails", async () => {
    const formData = new FormData();
    formData.append("firstName", "");
    formData.append("lastName", "");
    formData.append("email", "");
    formData.append("password", "");
    const result = await signUp(undefined, formData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors).toEqual({
        firstName: ["First name must be at least 2 characters long."],
        lastName: ["Last name must be at least 2 characters long."],
        email: ["Please enter a valid email."],
        password: ["Your password must be at least 8 characters long"],
      });
    }
  });

  it("tells the user when the email is already registered", async () => {
    bcrypt.hash = jest.fn().mockResolvedValue(hashedPassword);
    User.create = jest.fn().mockRejectedValue({ code: 11000 });

    const result = await signUp(undefined, validForm());

    expect(result).toEqual(
      expect.objectContaining({
        success: false,
        message: "User with this email already exists.",
      })
    );
  });

  it("should return an error if user creation fails", async () => {
    bcrypt.hash = jest.fn().mockResolvedValue(hashedPassword);
    User.create = jest
      .fn()
      .mockRejectedValue(new Error("User creation failed"));
    const result = await signUp(undefined, validForm());
    expect(result).toEqual(
      expect.objectContaining({
        success: false,
        message: "Failed to create user",
      })
    );
    expect(signIn).not.toHaveBeenCalled();
  });
});
