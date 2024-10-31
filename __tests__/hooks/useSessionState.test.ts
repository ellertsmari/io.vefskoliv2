import { renderHook, act, waitFor } from "@testing-library/react";
import { useSessionState } from "../../app/hooks/useSessionState";

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
});
