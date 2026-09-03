/**
 * @jest-environment node
 */
import { Types } from "mongoose";
import { User, UserDocument } from "models/user";
import {
  closeDatabase,
  clearDatabase,
  connect,
  createDummyUser,
} from "../__mocks__/mongoHandler";
import { updateUserInfo } from "serverActions/updateUserInfo";
import { auth } from "../../auth";

jest.mock("../../auth", () => ({
  auth: jest.fn(),
  updateSession: jest.fn().mockResolvedValue(null),
}));
import { updateSession } from "../../auth";

describe("updateUserInfo", () => {
  beforeAll(async () => await connect());
  afterAll(async () => await closeDatabase());
  beforeEach(async () => {
    await clearDatabase();
    jest.clearAllMocks();
  });

  it("should update user info", async () => {
    const updatedUserInfo = {
      background: "New background",
      careerGoals: "New career goals",
      interests: "New interests",
      favoriteArtists: "New favorite artists",
    };

    const mockUser = await createDummyUser();
    (auth as jest.Mock).mockResolvedValue({
      user: { id: mockUser._id.toString() },
    });

    const result = await updateUserInfo(updatedUserInfo);

    expect(result.success).toBe(true);
    // The header renders from the session token, so a save refreshes it.
    expect(updateSession).toHaveBeenCalled();

    const expectedUser = {
      ...mockUser.toObject(), // Get plain object representation of mockUser
      ...updatedUserInfo, // Merge in the updated fields
    };

    const actualUser = await User.findById(mockUser._id).lean();

    // Type assertion to inform TypeScript that these properties can be deleted
    delete (actualUser as any).updatedAt;
    delete (expectedUser as any).updatedAt;
    // The password hash is `select: false`, so a re-fetched user never carries
    // one — only the document we created by hand does.
    delete (expectedUser as any).password;

    expect(actualUser).toEqual(expectedUser);
  });

  it("should return error if user is not logged in", async () => {
    const updatedUserInfo = {
      background: "New background",
      careerGoals: "New career goals",
      interests: "New interests",
      favoriteArtists: "New favorite artists",
    };

    (auth as jest.Mock).mockResolvedValue(null);

    const result = await updateUserInfo(updatedUserInfo);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.message).toBe(
        "You must be logged in to perform this action"
      );
    }
  });

  it("refuses a field that is too long", async () => {
    const mockUser = await createDummyUser();
    (auth as jest.Mock).mockResolvedValue({
      user: { id: mockUser._id.toString() },
    });

    const result = await updateUserInfo({ background: "x".repeat(2001) });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.errors?.background).toBeDefined();
    expect((await User.findById(mockUser._id))?.background).toBe(
      mockUser.background
    );
  });

  it("refuses an avatar that is not a stored image", async () => {
    const mockUser = await createDummyUser();
    (auth as jest.Mock).mockResolvedValue({
      user: { id: mockUser._id.toString() },
    });

    const result = await updateUserInfo({
      avatarUrl: 'javascript:alert(1)',
    });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.errors?.avatarUrl).toBeDefined();
  });

  it("accepts an uploaded avatar and trims the text fields", async () => {
    const mockUser = await createDummyUser();
    (auth as jest.Mock).mockResolvedValue({
      user: { id: mockUser._id.toString() },
    });
    const avatarUrl =
      "https://abc123.public.blob.vercel-storage.com/avatars/me-xyz.jpg";

    const result = await updateUserInfo({ avatarUrl, background: "  hi  " });

    expect(result.success).toBe(true);
    const updated = await User.findById(mockUser._id);
    expect(updated?.avatarUrl).toBe(avatarUrl);
    expect(updated?.background).toBe("hi");
  });

  it("should return error if user info is invalid", async () => {
    // Mock user document
    const mockUser = await createDummyUser();
    (auth as jest.Mock).mockResolvedValue({
      user: { id: mockUser._id.toString() },
    });

    const updatedUserInfo = {
      background: "New background",
      careerGoals: "New career goals",
      interests: "New interests",
      favoriteArtists: "New favorite artists",
      // Not a profile field. `role` and `status` are the ones that matter;
      // the schema refuses every unknown key the same way.
      role: "teacher",
    };

    const result = await updateUserInfo(updatedUserInfo);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.message).toBe("Invalid input provided");
    }
  });
});
