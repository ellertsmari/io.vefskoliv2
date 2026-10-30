import {
  MODULE_COOKIE,
  moduleCookie,
  parseModuleChoice,
} from "app/guides/components/guides/moduleFilter";

describe("module filter cookie", () => {
  it("reads a module number, and everything else as all modules", () => {
    expect(parseModuleChoice("3")).toBe(3);
    expect(parseModuleChoice("0")).toBe(0);
    expect(parseModuleChoice("all")).toBeNull();
    expect(parseModuleChoice("null")).toBeNull(); // old localStorage value
    expect(parseModuleChoice(undefined)).toBeNull();
    expect(parseModuleChoice("-1")).toBeNull();
    expect(parseModuleChoice("2.5")).toBeNull();
    expect(parseModuleChoice("<script>")).toBeNull();
  });

  it("writes a choice that reads back the same", () => {
    for (const choice of [null, 0, 5]) {
      const value = moduleCookie(choice).split(";")[0].split("=")[1];
      expect(moduleCookie(choice).startsWith(`${MODULE_COOKIE}=`)).toBe(true);
      expect(parseModuleChoice(value)).toBe(choice);
    }
  });
});
