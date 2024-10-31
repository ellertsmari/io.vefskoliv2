import { isObjectOfExpectedType, objOnlyHasEnumKeys } from "utils/typeGuards";

// Suppress expected warnings
jest.spyOn(console, "warn").mockImplementation(() => {});

describe("isObjectOfExpectedType", () => {
  enum TestEnum {
    Key1 = "key1",
    Key2 = "key2",
    Key3 = "key3",
  }

  const typeDefinitions = {
    key1: "string",
    key2: "number",
    key3: "boolean",
  };

  it("should return true for valid object", async () => {
    const validObj = {
      key1: "Alice",
      key2: 30,
      key3: true,
    };

    const result = await isObjectOfExpectedType(validObj, typeDefinitions);

    expect(result).toBe(true);
  });

  it("should return false for object with invalid string type", async () => {
    const invalidObj = {
      key1: 123, // Invalid type
      key2: 30,
      key3: true,
    };

    const result = await isObjectOfExpectedType(invalidObj, typeDefinitions);

    expect(result).toBe(false);
  });

  it("should return false for object with invalid number type", async () => {
    const invalidObj = {
      key1: "Alice",
      key2: "30", // Invalid type
      key3: true,
    };

    const result = await isObjectOfExpectedType(invalidObj, typeDefinitions);

    expect(result).toBe(false);
  });

  it("should return false for object with invalid boolean type", async () => {
    const invalidObj = {
      key1: "Alice",
      key2: 30,
      key3: "true", // Invalid type
    };

    const result = await isObjectOfExpectedType(invalidObj, typeDefinitions);

    expect(result).toBe(false);
  });

  it("should return true for object with missing key", async () => {
    const invalidObj = {
      key1: "Alice",
      key2: 30,
      // Missing key3
    };

    const invalidObj2 = {
      // Missing key1
      key2: 30,
      // Missing key3
    };

    const result1 = await isObjectOfExpectedType(invalidObj, typeDefinitions);
    const result2 = await isObjectOfExpectedType(invalidObj2, typeDefinitions);

    expect(result1).toBe(true);
    expect(result2).toBe(true);
  });

  it("should return false for object with extra key", async () => {
    const invalidObj = {
      key1: "Alice",
      key2: 30,
      key3: true,
      key4: "extra", // Extra key
    };

    // @ts-expect-error: Allow extra key for testing
    const result = await isObjectOfExpectedType(invalidObj, typeDefinitions);
    expect(result).toBe(false);
  });
});

describe("objOnlyHasEnumKeys", () => {
  // Define an enum
  enum enumKeys {
    background = "background",
    careerGoals = "careerGoals",
    interests = "interests",
    favoriteArtists = "favoriteArtists",
    avatarUrl = "avatarUrl",
  }

  it("should return true if the object's keys are in the enum", async () => {
    const validObject = {
      background: "some background",
      careerGoals: "some career goals",
      interests: "some interests",
    };
    const result = await objOnlyHasEnumKeys(validObject, enumKeys);
    expect(result).toBe(true);
  });

  it("should return false if the object's keys are not in the enum", async () => {
    const invalidObject = {
      background: "some background",
      careerGoals: "some career goals",
      invalidKey: "some invalid key",
    };
    const result = await objOnlyHasEnumKeys(invalidObject, enumKeys);
    expect(result).toBe(false);
  });

  it("should return true if the object has no keys", async () => {
    const emptyObject = {};
    const result = await objOnlyHasEnumKeys(emptyObject, enumKeys);
    expect(result).toBe(true);
  });

  it("should return true if the object has all the enum keys", async () => {
    enum Enum {
      key1 = "Alice",
      key2 = 30,
    }
    const obj = {
      key1: "Alice",
      key2: 10,
    };
    const result = await objOnlyHasEnumKeys(obj, Enum);
    expect(result).toBe(true);
  });
});
