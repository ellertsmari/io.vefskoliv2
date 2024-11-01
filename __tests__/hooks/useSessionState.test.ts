import { renderHook, act, waitFor } from "@testing-library/react";
import { useSessionState } from "hooks/useSessionState";

describe("useSessionState", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("should return default value if no value is stored", () => {
    const { result } = renderHook(() => useSessionState("testKey", "default"));
    expect(result.current[0]).toBe("default");
  });

  it("should return stored value if value is already stored", () => {
    sessionStorage.setItem("testKey", JSON.stringify("storedValue"));
    const { result } = renderHook(() => useSessionState("testKey", "default"));
    expect(result.current[0]).toBe("storedValue");
  });

  it("should update sessionStorage when value is set", async () => {
    const { result } = renderHook(() => useSessionState("testKey", "default"));
    act(() => {
      result.current[1]("newValue");
    });
    await waitFor(() =>
      expect(sessionStorage.getItem("testKey")).toBe(JSON.stringify("newValue"))
    );
  });

  it("should remove item from sessionStorage when value is set to null", () => {
    sessionStorage.setItem("testKey", JSON.stringify("storedValue"));
    const { result } = renderHook(() => useSessionState("testKey", "default"));
    act(() => {
      result.current[1](null);
    });
    expect(sessionStorage.getItem("testKey")).toBeNull();
  });

  it("should handle number values", () => {
    const { result } = renderHook(() =>
      useSessionState<number>("testNumber", 0)
    );
    expect(result.current[0]).toBe(0);

    act(() => {
      result.current[1](42);
    });
    expect(sessionStorage.getItem("testNumber")).toBe(JSON.stringify(42));
    expect(result.current[0]).toBe(42);
  });

  it("should handle object values", () => {
    const defaultValue = { name: "John", age: 30 };
    const { result } = renderHook(() =>
      useSessionState<{ name: string; age: number }>("testObject", defaultValue)
    );
    expect(result.current[0]).toEqual(defaultValue);

    const newValue = { name: "Jane", age: 25 };
    act(() => {
      result.current[1](newValue);
    });
    expect(sessionStorage.getItem("testObject")).toBe(JSON.stringify(newValue));
    expect(result.current[0]).toEqual(newValue);
  });

  it("should handle array values", () => {
    const defaultValue = [1, 2, 3];
    const { result } = renderHook(() =>
      useSessionState<number[]>("testArray", defaultValue)
    );
    expect(result.current[0]).toEqual(defaultValue);

    const newValue = [4, 5, 6];
    act(() => {
      result.current[1](newValue);
    });
    expect(sessionStorage.getItem("testArray")).toBe(JSON.stringify(newValue));
    expect(result.current[0]).toEqual(newValue);
  });

  it("should handle custom serialization and deserialization functions", () => {
    const serialize = (value: number) => value.toString();
    const deserialize = (value: string) => parseInt(value, 10);
    const { result } = renderHook(() =>
      useSessionState("testKey", 0, serialize, deserialize)
    );
    expect(result.current[0]).toBe(0);

    act(() => {
      result.current[1](42);
    });
    expect(sessionStorage.getItem("testKey")).toBe("42");
    expect(result.current[0]).toBe(42);
  });

  it("should handle custom serialization and deserialization functions for objects", () => {
    const serialize = (value: { name: string }) => value.name;
    const deserialize = (value: string) => ({ name: value });
    const defaultValue = { name: "John" };
    const { result } = renderHook(() =>
      useSessionState("testObject", defaultValue, serialize, deserialize)
    );
    expect(result.current[0]).toEqual(defaultValue);

    const newValue = { name: "Jane" };
    act(() => {
      result.current[1](newValue);
    });
    expect(sessionStorage.getItem("testObject")).toBe("Jane");
    expect(result.current[0]).toEqual(newValue);
  });

  it("should handle custom serialization and deserialization functions for arrays", () => {
    const serialize = (value: number[]) => value.join(",");
    const deserialize = (value: string) => value.split(",").map(Number);
    const defaultValue = [1, 2, 3];
    const { result } = renderHook(() =>
      useSessionState("testArray", defaultValue, serialize, deserialize)
    );
    expect(result.current[0]).toEqual(defaultValue);

    const newValue = [4, 5, 6];
    act(() => {
      result.current[1](newValue);
    });
    expect(sessionStorage.getItem("testArray")).toBe("4,5,6");
    expect(result.current[0]).toEqual(newValue);
  });

  it("should handle custom serialization and deserialization functions for boolean values", () => {
    const serialize = (value: boolean) => (value ? "yes" : "no");
    const deserialize = (value: string) => value === "yes";
    const { result } = renderHook(() =>
      useSessionState("testKey", false, serialize, deserialize)
    );
    expect(result.current[0]).toBe(false);

    act(() => {
      result.current[1](true);
    });
    expect(sessionStorage.getItem("testKey")).toBe("yes");
    expect(result.current[0]).toBe(true);
  });

  it("should handle invalid JSON data in sessionStorage", async () => {
    sessionStorage.setItem("testKey", "invalid JSON");
    const consoleWarnMock = jest
      .spyOn(console, "warn")
      .mockImplementationOnce(() => {}); // Suppress expected console warning
    const { result } = renderHook(() => useSessionState("testKey", "default"));
    await waitFor(() => expect(result.current[0]).toBe("default"));
    expect(consoleWarnMock).toHaveBeenCalledTimes(1);
  });

  it("should handle undefined values", () => {
    const { result } = renderHook(() => useSessionState("testKey", undefined));
    expect(result.current[0]).toBeNull();

    act(() => {
      result.current[1](undefined);
    });
    expect(sessionStorage.getItem("testKey")).toBeNull();
    expect(result.current[0]).toBeNull();
  });

  it("should handle null values", () => {
    const { result } = renderHook(() => useSessionState("testKey", null));
    expect(result.current[0]).toBeNull();

    act(() => {
      result.current[1](null);
    });
    expect(sessionStorage.getItem("testKey")).toBeNull();
    expect(result.current[0]).toBeNull();
  });

  it("should handle non-serializable values", () => {
    const circularReference: { self?: any } = {};
    circularReference.self = circularReference;

    const consoleWarnMock = jest
      .spyOn(console, "warn")
      .mockImplementationOnce(() => {}); // Suppress expected console warning

    const { result } = renderHook(() => useSessionState("testKey"));

    act(() => {
      result.current[1](circularReference);
    });
    expect(sessionStorage.getItem("testKey")).toBe(null);
    expect(result.current[0]).toEqual(null);
  });

  it("should throw error with non-serializable default values", () => {
    const circularReference: { self?: any } = {};
    circularReference.self = circularReference;

    const renderWithCircularReference = () => {
      renderHook(() => useSessionState("testKey", circularReference));
    };

    expect(renderWithCircularReference).toThrow();
  });

  it("should handle updates with function", () => {
    const { result } = renderHook(() => useSessionState("testKey", 0));
    act(() => {
      result.current[1]((prev) => (prev !== null ? prev + 1 : 1));
    });
    expect(sessionStorage.getItem("testKey")).toBe(JSON.stringify(1));
    expect(result.current[0]).toBe(1);

    act(() => {
      result.current[1]((prev) => (prev !== null ? prev + 1 : 1));
    });
    expect(sessionStorage.getItem("testKey")).toBe(JSON.stringify(2));
    expect(result.current[0]).toBe(2);
  });
});
