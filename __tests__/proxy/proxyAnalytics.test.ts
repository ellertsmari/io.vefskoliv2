/**
 * @jest-environment node
 *
 * The proxy's analytics wiring: which requests schedule a page view. The
 * rules themselves are tested in utils/analytics.test.ts; this checks that
 * the proxy hands them the real login state, so a student is never recorded.
 */
import { NextRequest, after } from "next/server";

// auth() wraps the proxy and adds `request.auth`; the tests set it directly.
jest.mock("next-auth", () => ({
  __esModule: true,
  default: () => ({ auth: (handler: unknown) => handler }),
}));

jest.mock("next/server", () => ({
  ...jest.requireActual("next/server"),
  after: jest.fn(),
}));

const recordPageview = jest.fn();
jest.mock("../../app/lib/analytics/recordPageview", () => ({
  recordPageview: (...args: unknown[]) => recordPageview(...args),
}));

import proxy from "../../proxy";

type ProxyRequest = NextRequest & { auth: unknown };
const run = proxy as unknown as (request: ProxyRequest) => Response;

const BROWSER =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15";

const request = (
  path: string,
  { auth = null, headers = {} }: { auth?: unknown; headers?: Record<string, string> } = {}
) =>
  Object.assign(
    new NextRequest(`https://io.vefskoli.is${path}`, {
      headers: { accept: "text/html", "accept-language": "is", "user-agent": BROWSER, ...headers },
    }),
    { auth }
  ) as ProxyRequest;

const student = { user: { id: "1", role: "user" }, expires: "2099-01-01" };
const teacher = { user: { id: "2", role: "teacher" }, expires: "2099-01-01" };

describe("proxy analytics", () => {
  beforeEach(() => {
    jest.mocked(after).mockClear();
    recordPageview.mockClear();
  });

  it("records a logged-out visitor, after the response", async () => {
    const response = run(request("/guides?utm_source=tskoli"));
    expect(response.status).toBe(200);
    expect(after).toHaveBeenCalledTimes(1);
    expect(recordPageview).not.toHaveBeenCalled();

    const task = jest.mocked(after).mock.calls[0][0] as () => Promise<void>;
    await task();
    expect(recordPageview).toHaveBeenCalledWith(
      expect.objectContaining({ path: "/guides", search: "?utm_source=tskoli" })
    );
  });

  it.each([
    ["a student", student],
    ["a teacher", teacher],
  ])("never records %s", (_, auth) => {
    run(request("/guides", { auth }));
    run(request("/", { auth }));
    run(request("/LMS/dashboard", { auth }));
    expect(after).not.toHaveBeenCalled();
  });

  it("serves robots.txt to a crawler and records the fetch", () => {
    const response = run(
      request("/robots.txt", { headers: { "user-agent": "ClaudeBot/1.0", accept: "*/*" } })
    );
    expect(response.status).toBe(200);
    expect(after).toHaveBeenCalledTimes(1);
  });

  it("does not record pages behind the login, or the sign-in page", () => {
    expect(run(request("/LMS/dashboard")).status).toBe(307);
    run(request("/signin"));
    expect(after).not.toHaveBeenCalled();
  });
});
