import { CredentialsSignin } from "next-auth";

/**
 * Sign-in errors that carry a reason the user is allowed to see.
 *
 * Auth.js turns anything thrown from `authorize` that is not one of its own
 * error classes into a generic "Something went wrong", and it maps a bare
 * `CredentialsSignin` to "Invalid credentials". Subclassing keeps the error on
 * the credentials path while the `code` lets `authenticate` tell them apart:
 *
 * - a student whose account has not been approved yet must not be told their
 *   password is wrong, or they will register again under a new address;
 * - someone who has been throttled should be told to wait, not to retype.
 *
 * The code ends up in a redirect URL on the non-server-action path, so it must
 * not reveal anything (Auth.js documents this on `CredentialsSignin.code`).
 * "pending" is only reached after the password already matched, and
 * "rate_limited" says nothing about whether the address exists.
 */
export const PENDING_APPROVAL_CODE = "pending";
export const RATE_LIMITED_CODE = "rate_limited";

export class PendingApprovalError extends CredentialsSignin {
  code = PENDING_APPROVAL_CODE;
}

export class RateLimitedError extends CredentialsSignin {
  code = RATE_LIMITED_CODE;
}
