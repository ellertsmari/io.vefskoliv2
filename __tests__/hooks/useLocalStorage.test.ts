import { renderHook, act } from "@testing-library/react";
import { useLocalStorage } from "../../app/hooks/useLocalStorage";

describe("useLocalStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should return default value if no value is stored", () => {
    const { result } = renderHook(() => useLocalStorage("testKey", "default"));
    expect(result.current[0]).toBe("default");
  });

  it("should return stored value if value is already stored", () => {
    localStorage.setItem("testKey", JSON.stringify("storedValue"));
    const { result } = renderHook(() => useLocalStorage("testKey", "default"));
    expect(result.current[0]).toBe("storedValue");
  });

  it("should update localStorage when value is set", () => {
    const { result } = renderHook(() => useLocalStorage("testKey", "default"));
    act(() => {
      result.current[1]("newValue");
    });
    expect(localStorage.getItem("testKey")).toBe(JSON.stringify("newValue"));
  });

  it("should remove item from localStorage when value is set to null", () => {
    localStorage.setItem("testKey", JSON.stringify("storedValue"));
    const { result } = renderHook(() => useLocalStorage("testKey", "default"));
    act(() => {
      result.current[1](null);
    });
    expect(localStorage.getItem("testKey")).toBeNull();
  });

  it("should handle number values", () => {
    const { result } = renderHook(() =>
      useLocalStorage<number>("testNumber", 0)
    );
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
      useLocalStorage<{ name: string; age: number }>("testObject", defaultValue)
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
      useLocalStorage<number[]>("testArray", defaultValue)
    );
    expect(result.current[0]).toEqual(defaultValue);

    const newValue = [4, 5, 6];
    act(() => {
      result.current[1](newValue);
    });
    expect(localStorage.getItem("testArray")).toBe(JSON.stringify(newValue));
    expect(result.current[0]).toEqual(newValue);
  });
});
