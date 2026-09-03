/**
 * @jest-environment node
 */
import { CredentialsSignin } from "next-auth";
import { authenticate } from "serverActions/authenticate";
import { PendingApprovalError, RateLimitedError } from "app/lib/authErrors";
import { signIn } from "../../auth";

jest.mock("../../auth", () => ({
  signIn: jest.fn(),
}));

// `redirect()` throws in Next; here it only needs to be observable.
jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));
import { redirect } from "next/navigation";

const form = () => {
  const formData = new FormData();
  formData.append("email", "anna@example.com");
  formData.append("password", "correct horse");
  return formData;
};

describe("authenticate", () => {
  afterEach(() => jest.clearAllMocks());

  it("redirects to the dashboard on success", async () => {
    (signIn as jest.Mock).mockResolvedValue(undefined);

    await authenticate(undefined, form());

    expect(redirect).toHaveBeenCalledWith("/LMS/dashboard");
  });

  it("says 'invalid credentials' for a wrong password", async () => {
    (signIn as jest.Mock).mockRejectedValue(new CredentialsSignin());

    expect(await authenticate(undefined, form())).toBe("Invalid credentials.");
    expect(redirect).not.toHaveBeenCalled();
  });

  it("tells a pending user to wait for approval, not that their password is wrong", async () => {
    (signIn as jest.Mock).mockRejectedValue(new PendingApprovalError());

    const message = await authenticate(undefined, form());

    expect(message).toMatch(/waiting for a teacher to approve/i);
    expect(message).not.toMatch(/invalid/i);
    expect(redirect).not.toHaveBeenCalled();
  });

  it("tells a throttled user to wait instead of retyping", async () => {
    (signIn as jest.Mock).mockRejectedValue(new RateLimitedError());

    const message = await authenticate(undefined, form());

    expect(message).toMatch(/too many attempts/i);
    expect(redirect).not.toHaveBeenCalled();
  });
});
