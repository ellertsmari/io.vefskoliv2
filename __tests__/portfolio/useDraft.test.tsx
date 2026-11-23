
import { act, renderHook, waitFor } from "@testing-library/react";
import { useDraft } from "../../app/LMS/portfolio/builder/useDraft";
import { getMyPortfolio } from "serverActions/portfolio/getMyPortfolio";
import { getPortfolioStudentId } from "serverActions/portfolio/getPortfolioStudentId";

// Replace real server calls with test versions

jest.mock("serverActions/portfolio/getMyPortfolio", () => ({
  getMyPortfolio: jest.fn(),
}));

jest.mock("serverActions/portfolio/getPortfolioStudentId", () => ({
  getPortfolioStudentId: jest.fn(),
}));

describe("useDraft", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();

    jest.mocked(getPortfolioStudentId).mockResolvedValue("test-student");
    jest.mocked(getMyPortfolio).mockResolvedValue({
      success: true,
      data: null,
    });
  });

  test("automatically saves profile changes for the student", async () => {
    const { result } = renderHook(() => useDraft());

    // Wait for the hook to finish loading
    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    // Simulate a student editing their name
    act(() => {
      result.current.updateProfile({ name: "Anna" });
    });

    // Check that the browser saved the new name
    await waitFor(() => {
      const saved = localStorage.getItem("portfolio-draft:test-student");

      expect(saved).not.toBeNull();
      expect(JSON.parse(saved!).content.profile.name).toBe("Anna");
    });
  });

  test("uses the local draft instead of loading the server portfolio", async () => {
    // Pretend the student already has a draft in the browser
    const existingDraft = {
      content: {
        profile: {
          name: "Anna's unfinished portfolio",
          headline: "",
          tagline: "",
          about: "",
          photoUrl: null,
          location: "",
          skills: [],
          languages: [],
        },
        availability: {
          openToInternships: false,
          availableFrom: new Date("2026-12-01"),
          lookingFor: "",
        },
        projects: [],
        contact: {
          email: "",
          linkedinUrl: "",
          githubUrl: "",
          cvUrl: "",
        },
        theme: "editorial",
      },
      savedAt: "2026-11-23T10:00:00.000Z",
      basedOn: null,
    };

    localStorage.setItem(
      "portfolio-draft:test-student",
      JSON.stringify(existingDraft)
    );

    // Start the hook
    const { result } = renderHook(() => useDraft());

    // Wait until loading is complete
    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    // The local draft should appear
    expect(result.current.draft.content.profile.name).toBe(
      "Anna's unfinished portfolio"
    );

    // The server should NOT have been called
    expect(getMyPortfolio).not.toHaveBeenCalled();

    // The hook should remember there are local changes
    expect(result.current.hasLocalChanges).toBe(true);
  });
  
  test("loads the server portfolio when no local draft exists", async () => {
    // Pretend the server already has a portfolio
    jest.mocked(getMyPortfolio).mockResolvedValue({
      success: true,
      data: {
        content: {
          profile: {
            name: "Anna's published portfolio",
            headline: "Frontend Developer",
            tagline: "",
            about: "",
            photoUrl: null,
            location: "",
            skills: [],
            languages: [],
          },
          availability: {
            openToInternships: true,
            availableFrom: "2026-12-01T00:00:00.000Z",
            lookingFor: "",
          },
          projects: [],
          contact: {
            email: "",
            linkedinUrl: "",
            githubUrl: "",
            cvUrl: "",
          },
          theme: "editorial",
        },
        slug: "anna",
        visibility: "public",
        publishedAt: "2026-11-20T10:00:00.000Z",
        updatedAt: "2026-11-21T10:00:00.000Z",
      },
    });

    // Start the hook with empty localStorage
    const { result } = renderHook(() => useDraft());

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    // The server portfolio should be loaded
    expect(result.current.draft.content.profile.name).toBe(
      "Anna's published portfolio"
    );

    // The server should have been called
    expect(getMyPortfolio).toHaveBeenCalled();

    // The date string should become a Date object
    expect(
      result.current.draft.content.availability.availableFrom
    ).toBeInstanceOf(Date);

    // Loading a portfolio is not a new local edit
    expect(result.current.hasLocalChanges).toBe(false);
  });

  test("shows an error when no student is logged in", async () => {
    // Pretend there is no logged-in student
    jest.mocked(getPortfolioStudentId).mockResolvedValue(null);

    const { result } = renderHook(() => useDraft());

    // Wait for the loading process to finish
    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    // The hook should show an error
    expect(result.current.error).toBe(
      "Please sign in to edit your portfolio."
    );

    // It should not request portfolio data
    expect(getMyPortfolio).not.toHaveBeenCalled();

    // It should not report local changes
    expect(result.current.hasLocalChanges).toBe(false);
  });

  test("shows an error when localStorage cannot save", async () => {
    const { result } = renderHook(() => useDraft());

    // Wait until the draft has finished loading
    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    // Pretend the browser cannot save anything
    const saveSpy = jest
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("Storage full");
      });

    try {
      // Simulate the student editing their name
      act(() => {
        result.current.updateProfile({ name: "Anna" });
      });

      // The hook should show a helpful error
      await waitFor(() => {
        expect(result.current.error).toBe(
          "Could not save your draft in this browser."
        );
      });
    } finally {
      // Restore normal browser storage behavior
      saveSpy.mockRestore();
    }
  });

});
