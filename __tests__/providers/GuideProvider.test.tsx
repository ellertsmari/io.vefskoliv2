import { renderHook, act } from "@testing-library/react"; // Ensure you have this import
import { GradesGivenStatus } from "../../app/guides/types";
import { useGuide, GuideProvider } from "../../app/providers/GuideProvider"; // Import the provider
import {
  clearDatabase,
  closeDatabase,
  connect,
  createDummyExtendedGuides,
  createDummyFetchedGuideWithControl,
  createDummyUser,
} from "../__mocks__/mongoHandler";

describe("useGuide", () => {
  beforeAll(async () => await connect());

  afterEach(async () => await clearDatabase());

  afterAll(async () => await closeDatabase());

  test("provides the correct guide context value", async () => {
    const user = await createDummyUser();
    const mockGuides = await createDummyExtendedGuides(user, 1);

    const { result } = renderHook(() => useGuide(), {
      wrapper: ({ children }) => (
        <GuideProvider guide={mockGuides[0]}>{children}</GuideProvider>
      ),
    });

    // The guide should initially match the mock
    expect(result.current.guide._id).toBe(mockGuides[0]._id);
  });

  test("updateGrades function updates the guide context state", async () => {
    const user = await createDummyUser();
    const guide = await createDummyFetchedGuideWithControl(user, {
      feedbackReceived: 2,
      feedbackGiven: 2,
      availableToGrade: 2,
      gradesGiven: 1,
    });

    const { result } = renderHook(() => useGuide(), {
      wrapper: ({ children }) => (
        <GuideProvider guide={guide}>{children}</GuideProvider>
      ),
    });

    const docToGrade = guide.availableToGrade[0];
    docToGrade.grade = 5;

    // Simulate the updateGrades function
    act(() => {
      result.current.updateGradeStatus();
    });

    // Check if gradesGiven contains the updated document
    expect(result.current.guide.gradesGivenStatus).toEqual(
      GradesGivenStatus.GRADES_GIVEN
    );
    // Add more assertions based on your expected state changes
  });
});
