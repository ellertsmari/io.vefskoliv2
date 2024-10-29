import { renderHook } from "@testing-library/react"; // Ensure you have this import
import { useGuide, GuideProvider } from "../../app/providers/GuideProvider"; // Import the provider
import {
  clearDatabase,
  closeDatabase,
  connect,
  createDummyExtendedGuides,
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
});
