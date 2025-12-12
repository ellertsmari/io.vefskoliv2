import { signUp } from "serverActions/signUp";
import { getUser, signIn } from "../../auth";
import bcrypt from "bcrypt";
import { User } from "models/user";

jest.mock("../../auth", () => ({
  getUser: jest.fn(),
  signIn: jest.fn(),
}));

describe("signUp", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  const firstName = "John";
  const lastName = "Doe";
  const email = "john.doe@example.com";
  const password = "password123";
  const hashedPassword = "hashedPassword123";
  it("should sign up a new user", async () => {
    const formData = new FormData();
    formData.append("firstName", firstName);
    formData.append("lastName", lastName);
    formData.append("email", email);
    formData.append("password", password);
    bcrypt.hash = jest.fn().mockResolvedValueOnce(hashedPassword);
    User.create = jest.fn();
    (getUser as jest.Mock).mockResolvedValueOnce({ email });
    (signIn as jest.Mock).mockResolvedValueOnce(true);
    const result = await signUp(undefined, formData);
    expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
    expect(User.create).toHaveBeenCalledWith({
      name: firstName + " " + lastName,
      email,
      password: hashedPassword,
      role: "user",
    });
    expect(signIn).toHaveBeenCalledWith("credentials", {
      email: "john.doe@example.com",
      password: "password123",
    });
    expect(result).toEqual({
      success: true,
      data: undefined,
      message:
        "Successfully registered. Now logging you in. If it fails you will be redirected to the login page.",
    });
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
  it("should not call signIn if user cannot be found in the DB", async () => {
    const formData = new FormData();
    formData.append("firstName", firstName);
    formData.append("lastName", lastName);
    formData.append("email", email);
    formData.append("password", password);
    bcrypt.hash = jest.fn().mockResolvedValue(hashedPassword);
    (getUser as jest.Mock).mockRejectedValueOnce(new Error("User not found"));
    const result = await signUp(undefined, formData);
    expect(signIn).not.toHaveBeenCalled();
  });
  it("should return an error if user creation fails", async () => {
    const formData = new FormData();
    formData.append("firstName", firstName);
    formData.append("lastName", lastName);
    formData.append("email", email);
    formData.append("password", password);
    bcrypt.hash = jest.fn().mockResolvedValue(hashedPassword);
    User.create = jest
      .fn()
      .mockRejectedValue(new Error("User creation failed"));
    const result = await signUp(undefined, formData);
    expect(result).toEqual(
      expect.objectContaining({
        success: false,
        message: "Failed to create user",
      })
    );
    expect(signIn).not.toHaveBeenCalled();
  });
});
