import mongoose from "mongoose";
import { User, UserDocument } from "../../app/models/user";
import {
  clearDatabase,
  closeDatabase,
  connect,
} from "../__mocks__/mongoHandler";

describe("User model", () => {
  beforeAll(async () => {
    // Connect to the database
    await connect();
  });

  afterEach(async () => {
    // Clear the database
    await clearDatabase();
  });

  afterAll(async () => {
    // Disconnect from the database
    await closeDatabase();
  });

  describe("updateUserInfo", () => {
    let user: UserDocument;

    beforeEach(async () => {
      user = await User.create({
        _id: new mongoose.Types.ObjectId(),
        name: "Test User",
        email: "test@example.com",
        password: "testpassword",
        createdAt: new Date(),
        role: "user",
      });

      // Create a test user
      await user.save();
    });

    afterEach(async () => {
      // Remove the test user
      await user.deleteOne();
    });

    it("should update user ", async () => {
      await user.updateUserInfo({ background: "New background info" });

      const updatedUser = await User.findById(user.id);

      expect(updatedUser.background).toBe("New background info");
    });

    it("should not update user if user does not exist", async () => {
      // Remove the test user
      await user.deleteOne();

      try {
        // Attempt to update the user's info
        await user.updateUserInfo({ background: "New background info" });
      } catch (error) {
        // Check that an error was thrown
        expect(error).toBeDefined();
      }
    });
  });
});
