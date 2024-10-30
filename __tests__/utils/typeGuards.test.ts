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

  it("should return true for valid object", () => {
    const validObj = {
      key1: "Alice",
      key2: 30,
      key3: true,
    };

    expect(isObjectOfExpectedType(validObj, typeDefinitions)).toBe(true);
  });

  it("should return false for object with invalid string type", () => {
    const invalidObj = {
      key1: 123, // Invalid type
      key2: 30,
      key3: true,
    };

    expect(isObjectOfExpectedType(invalidObj, typeDefinitions)).toBe(false);
  });

  it("should return false for object with invalid number type", () => {
    const invalidObj = {
      key1: "Alice",
      key2: "30", // Invalid type
      key3: true,
    };

    expect(isObjectOfExpectedType(invalidObj, typeDefinitions)).toBe(false);
  });

  it("should return false for object with invalid boolean type", () => {
    const invalidObj = {
      key1: "Alice",
      key2: 30,
      key3: "true", // Invalid type
    };

    expect(isObjectOfExpectedType(invalidObj, typeDefinitions)).toBe(false);
  });

  it("should return true for object with missing key", () => {
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

    expect(isObjectOfExpectedType(invalidObj, typeDefinitions)).toBe(true);
    expect(isObjectOfExpectedType(invalidObj2, typeDefinitions)).toBe(true);
  });

  it("should return false for object with extra key", () => {
    const invalidObj = {
      key1: "Alice",
      key2: 30,
      key3: true,
      key4: "extra", // Extra key
    };

    // @ts-expect-error: Allow extra key for testing

    expect(isObjectOfExpectedType(invalidObj, typeDefinitions)).toBe(false);
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

  it("should return true if the object's keys are in the enum", () => {
    const validObject = {
      background: "some background",
      careerGoals: "some career goals",
      interests: "some interests",
    };
    const result = objOnlyHasEnumKeys(validObject, enumKeys);
    expect(result).toBe(true);
  });

  it("should return false if the object's keys are not in the enum", () => {
    const invalidObject = {
      background: "some background",
      careerGoals: "some career goals",
      invalidKey: "some invalid key",
    };
    const result = objOnlyHasEnumKeys(invalidObject, enumKeys);
    expect(result).toBe(false);
  });

  it("should return true if the object has no keys", () => {
    const emptyObject = {};
    const result = objOnlyHasEnumKeys(emptyObject, enumKeys);
    expect(result).toBe(true);
  });

  it("should return true if the object has all the enum keys", () => {
    enum Enum {
      key1 = "Alice",
      key2 = 30,
    }
    const obj = {
      key1: "Alice",
      key2: 10,
    };
    const result = objOnlyHasEnumKeys(obj, Enum);
    expect(result).toBe(true);
  });
});
