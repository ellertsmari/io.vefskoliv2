import { renderHook, act } from "@testing-library/react";
import { useLocalState } from "../../app/hooks/useLocalState";

describe("useLocalState", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should return default value if no value is stored", () => {
    const { result } = renderHook(() => useLocalState("testKey", "default"));
    expect(result.current[0]).toBe("default");
  });

  it("should return stored value if value is already stored", () => {
    localStorage.setItem("testKey", JSON.stringify("storedValue"));
    const { result } = renderHook(() => useLocalState("testKey", "default"));
    expect(result.current[0]).toBe("storedValue");
  });

  it("should update localStorage when value is set", () => {
    const { result } = renderHook(() => useLocalState("testKey", "default"));
    act(() => {
      result.current[1]("newValue");
    });
    expect(localStorage.getItem("testKey")).toBe(JSON.stringify("newValue"));
  });

  it("should remove item from localStorage when value is set to null", () => {
    localStorage.setItem("testKey", JSON.stringify("storedValue"));
    const { result } = renderHook(() => useLocalState("testKey", "default"));
    act(() => {
      result.current[1](null);
    });
    expect(localStorage.getItem("testKey")).toBeNull();
  });

  it("should handle number values", () => {
    const { result } = renderHook(() => useLocalState<number>("testNumber", 0));
    expect(result.current[0]).toBe(0);

    act(() => {
      result.current[1](42);
    });
    expect(localStorage.getItem("testNumber")).toBe(JSON.stringify(42));
    expect(result.current[0]).toBe(42);
  });

  it("should handle object values", () => {
    const defaultValue = { name: "John", age: 30 };
    const { result } = renderHook(() =>
      useLocalState<{ name: string; age: number }>("testObject", defaultValue)
    );
    expect(result.current[0]).toEqual(defaultValue);

    const newValue = { name: "Jane", age: 25 };
    act(() => {
      result.current[1](newValue);
    });
    expect(localStorage.getItem("testObject")).toBe(JSON.stringify(newValue));
    expect(result.current[0]).toEqual(newValue);
  });

  it("should handle array values", () => {
    const defaultValue = [1, 2, 3];
    const { result } = renderHook(() =>
      useLocalState<number[]>("testArray", defaultValue)
    );
    expect(result.current[0]).toEqual(defaultValue);

    const newValue = [4, 5, 6];
    act(() => {
      result.current[1](newValue);
    });
    expect(localStorage.getItem("testArray")).toBe(JSON.stringify(newValue));
    expect(result.current[0]).toEqual(newValue);
  });

  it("should handle custom serialization and deserialization functions", () => {
    const serialize = (value: number) => value.toString();
    const deserialize = (value: string) => parseInt(value, 10);
    const { result } = renderHook(() =>
      useLocalState<number>("testKey", 0, serialize, deserialize)
    );

    act(() => {
      result.current[1](42);
    });
    expect(localStorage.getItem("testKey")).toBe("42");
    expect(result.current[0]).toBe(42);
  });

  it("should handle custom serialization and deserialization functions for objects", () => {
    const serialize = (value: { name: string; age: number }) =>
      `${value.name}:${value.age}`;
    const deserialize = (value: string) => {
      const [name, age] = value.split(":");
      return { name, age: parseInt(age, 10) };
    };

    const defaultValue = { name: "John", age: 30 };
    const { result } = renderHook(() =>
      useLocalState<{ name: string; age: number }>(
        "testObject",
        defaultValue,
        serialize,
        deserialize
      )
    );

    const newValue = { name: "Jane", age: 25 };
    act(() => {
      result.current[1](newValue);
    });
    expect(localStorage.getItem("testObject")).toBe("Jane:25");
    expect(result.current[0]).toEqual(newValue);
  });

  it("should update state when localStorage changes", () => {
    const { result } = renderHook(() => useLocalState("testKey", "default"));

    // Initial state should be the default value
    expect(result.current[0]).toBe("default");

    // Simulate localStorage change from another tab/window
    act(() => {
      localStorage.setItem("testKey", JSON.stringify("newValue"));
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "testKey",
          newValue: JSON.stringify("newValue"),
        })
      );
    });

    expect(result.current[0]).toBe("newValue");
  });
});