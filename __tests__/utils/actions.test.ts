import { User } from "../../app/models/user";
import bcrypt from "bcrypt";
import { returnGuide, signUp } from "../../app/utils/actions";
import { auth, getUser, signIn } from "../../auth";
import { Return } from "../../app/models/return";
import {
  closeDatabase,
  clearDatabase,
  connect,
} from "../__mocks__/mongoHandler";
import { Types } from "mongoose";

jest.mock("bcrypt");
jest.mock("../../auth", () => ({
  getUser: jest.fn(),
  signIn: jest.fn(),
  auth: jest.fn(),
}));
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

      bcrypt.hash = jest.fn().mockResolvedValueOnce(hashedPassword);

      User.create = jest.fn();

      (getUser as jest.Mock).mockResolvedValueOnce({ email });
      (signIn as jest.Mock).mockResolvedValueOnce(true);

      const result = await signUp({}, formData);

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
      const formData = new FormData();
      formData.append("firstName", "");
      formData.append("lastName", "");
      formData.append("email", "");
      formData.append("password", "");

      const result = await signUp({}, formData);

      expect(result.success).toBe(false);
      expect(result.errors).toEqual({
        firstName: ["First name must be at least 2 characters long."],
        lastName: ["Last name must be at least 2 characters long."],
        email: ["Please enter a valid email."],
        password: ["Your password must be at least 8 characters long"],
      });
    });

    it("should not call signIn if user cannot be found in the DB", async () => {
      const formData = new FormData();

      formData.append("firstName", firstName);
      formData.append("lastName", lastName);
      formData.append("email", email);
      formData.append("password", password);

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

  describe("returnGuide", () => {
    beforeAll(async () => await connect());
    afterAll(async () => await closeDatabase());
    afterEach(async () => {
      await clearDatabase();
      jest.resetAllMocks();
    });

    const projectUrl = "https://github.com/example/project";
    const liveVersion = "https://example.com/live-version";
    const projectName = "Example Project";
    const comment = "This is an example project.";
    const guideId = new Types.ObjectId();
    const userId = new Types.ObjectId();

    (auth as jest.Mock).mockResolvedValue({
      user: { id: userId },
    });

    it("should return a guide", async () => {
      const state = {}; // Add any necessary properties to this object
      const formData = new FormData();
      formData.append("projectUrl", projectUrl);
      formData.append("liveVersion", liveVersion);
      formData.append("projectName", projectName);
      formData.append("comment", comment);
      formData.append("imageOfProject", "");
      formData.append("guideId", guideId.toString());

      const result = await returnGuide(state, formData);
      expect(result).toEqual({
        success: true,
        message: "Return submitted successfully",
      });

      const theReturn = await Return.findOne({ owner: userId });
      expect(theReturn).toMatchObject({
        projectUrl,
        liveVersion,
        projectName,
        comment,
        owner: userId,
        guide: guideId,
      });
    });

    // returnGuide test
    it("should handle form parsing errors", async () => {
      const state = {};
      const formData = new FormData();
      formData.append("projectUrl", ""); // Empty string should fail validation
      formData.append("liveVersion", ""); // Empty string should fail validation
      formData.append("projectName", ""); // Empty string should fail validation
      formData.append("comment", ""); // Empty string should fail validation
      formData.append("guideId", guideId.toString());

      const result = await returnGuide(state, formData);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });
});
