import { User } from "../../app/models/user";
import { SignupFormSchema } from "../../app/utils/formvalidation";
import bcrypt from "bcrypt";
import { signUp } from "../../app/utils/actions";
import { getUser, signIn } from "../../auth";

jest.mock("bcrypt");
jest.mock("../../auth", () => ({
  getUser: jest.fn(),
  signIn: jest.fn(),
}));
jest.mock("../../app/utils/formvalidation");
jest.mock("next-auth", () => ({
  AuthError: jest.fn().mockImplementation(), // Mock the AuthError class
}));

describe("server actions", () => {
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

      SignupFormSchema.safeParse = jest.fn().mockReturnValueOnce({
        success: true,
        data: {
          firstName,
          lastName,
          email,
          password,
        },
      });

      bcrypt.hash = jest.fn().mockResolvedValueOnce(hashedPassword);

      User.create = jest.fn();

      (getUser as jest.Mock).mockResolvedValueOnce({ email });
      (signIn as jest.Mock).mockResolvedValueOnce(true);

      const result = await signUp({}, formData);

      expect(SignupFormSchema.safeParse).toHaveBeenCalledWith({
        firstName,
        lastName,
        email,
        password,
      });

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
        message:
          "Successfully registered. Now logging you in. If it fails you will be redirected to the login page.",
      });
    });

    it("should return an error if form validation fails", async () => {
      const errors = ["Validation failed", "Please enter a valid email"];

      const formData = new FormData();
      formData.append("firstName", "");
      formData.append("lastName", "");
      formData.append("email", "");
      formData.append("password", "");

      SignupFormSchema.safeParse = jest.fn().mockReturnValueOnce({
        success: false,
        error: {
          flatten: () => {
            return { fieldErrors: errors };
          },
        },
      });

      const result = await signUp({}, formData);

      expect(result).toEqual({
        success: false,
        errors: errors,
      });
    });

    it("should not call signIn if user cannot be found in the DB", async () => {
      const formData = new FormData();

      formData.append("firstName", firstName);
      formData.append("lastName", lastName);
      formData.append("email", email);
      formData.append("password", password);

      SignupFormSchema.safeParse = jest.fn().mockReturnValueOnce({
        success: true,
        data: {
          firstName,
          lastName,
          email,
          password,
        },
      });

      bcrypt.hash = jest.fn().mockResolvedValue(hashedPassword);

      (getUser as jest.Mock).mockRejectedValueOnce(new Error("User not found"));
      const result = await signUp({}, formData);

      expect(signIn).not.toHaveBeenCalled();
    });

    it("should return an error if user creation fails", async () => {
      const formData = new FormData();
      formData.append("firstName", firstName);
      formData.append("lastName", lastName);
      formData.append("email", email);
      formData.append("password", password);

      SignupFormSchema.safeParse = jest.fn().mockReturnValue({
        success: true,
        data: {
          firstName,
          lastName,
          email,
          password,
        },
      });

      bcrypt.hash = jest.fn().mockResolvedValue(hashedPassword);

      User.create = jest
        .fn()
        .mockRejectedValue(new Error("User creation failed"));

      const result = await signUp({}, formData);

      expect(result).toEqual({
        success: false,
        message: "Failed to create user. May already exist.",
      });

      expect(signIn).not.toHaveBeenCalled();
    });
  });
});
