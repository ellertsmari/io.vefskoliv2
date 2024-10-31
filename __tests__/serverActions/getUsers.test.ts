import { mock } from "node:test";
import {
  closeDatabase,
  clearDatabase,
  connect,
  createDummyUser,
} from "../__mocks__/mongoHandler";
import { getUsers } from "serverActions/getUsers";
import { ShareableUserInfo } from "types/types";
import { OptionalUserInfoKeys, User, UserWithIdType } from "models/user";

describe("getUsers", () => {
  beforeAll(async () => await connect());
  afterAll(async () => await closeDatabase());
  beforeEach(async () => {
    await clearDatabase();
    jest.clearAllMocks();
  });

  const shareableKeys = Object.keys(OptionalUserInfoKeys).concat(
    "name"
  ) as (keyof ShareableUserInfo)[];

  it("should return shareable user info with all fields", async () => {
    const mockUserDoc = await createDummyUser();
    const mockUserObject = mockUserDoc.toObject();
    const mockUserDoc2 = await createDummyUser();
    const mockUserObject2 = mockUserDoc.toObject();

    const result = await getUsers();
    const expected: ShareableUserInfo[] = [
      {
        name: mockUserObject.name,
        background: mockUserObject.background,
        careerGoals: mockUserObject.careerGoals,
        interests: mockUserObject.interests,
        favoriteArtists: mockUserObject.favoriteArtists,
        avatarUrl: mockUserObject.avatarUrl,
      },
      {
        name: mockUserObject2.name,
        background: mockUserObject2.background,
        careerGoals: mockUserObject2.careerGoals,
        interests: mockUserObject2.interests,
        favoriteArtists: mockUserObject2.favoriteArtists,
        avatarUrl: mockUserObject2.avatarUrl,
      },
    ];

    expect(result).toEqual(expect.arrayContaining(expected));
  });

  it("should return shareable user info with missing optional fields", async () => {
    const mockUserDoc = await createDummyUser("user", {
      background: undefined,
      careerGoals: "",
      interests: "",
      avatarUrl: undefined,
    });
    const mockUserObject = mockUserDoc.toObject();

    const result = await getUsers({});
    const expected: ShareableUserInfo[] = [
      {
        name: mockUserObject.name,
        background: mockUserObject.background,
        favoriteArtists: mockUserObject.favoriteArtists,
        avatarUrl: mockUserObject.avatarUrl,
      },
    ];

    expect(result).toEqual(expect.arrayContaining(expected));
  });

  it("should return an empty array when no users are found", async () => {
    const result = await getUsers({});
    expect(result).toEqual([]);
  });
});
