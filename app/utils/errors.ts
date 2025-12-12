/**
 * Standardized Error Handling Utilities
 *
 * This module provides consistent error handling patterns for server actions.
 * All server actions should use these utilities for consistent error responses.
 */

/**
 * Standard response type for server actions that can fail
 */
export type ActionResult<T = void> =
  | { success: true; data: T; message?: string }
  | { success: false; message: string; errors?: Record<string, string[]> };

/**
 * Creates a successful action result
 */
export function success<T>(data: T, message?: string): ActionResult<T> {
  return { success: true, data, message };
}

/**
 * Creates a successful action result with no data
 */
export function successNoData(message?: string): ActionResult<void> {
  return { success: true, data: undefined, message };
}

/**
 * Creates a failed action result
 */
export function failure(
  message: string,
  errors?: Record<string, string[]>
): ActionResult<never> {
  return { success: false, message, errors };
}

/**
 * Normalizes unknown errors to Error objects
 */
export function normalizeError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }
  return new Error(String(error));
}

/**
 * Logs an error with consistent formatting
 * @param context - The context/function name where the error occurred
 * @param error - The error to log
 * @param additionalInfo - Optional additional information to log
 */
export function logError(
  context: string,
  error: unknown,
  additionalInfo?: Record<string, unknown>
): void {
  const normalizedError = normalizeError(error);
  const timestamp = new Date().toISOString();

  console.error(`[${timestamp}] [${context}] ${normalizedError.message}`, {
    stack: normalizedError.stack,
    ...additionalInfo,
  });
}

/**
 * Handles errors in server actions consistently
 * Logs the error and returns a failure result
 */
export function handleActionError(
  context: string,
  error: unknown,
  userMessage: string = "An unexpected error occurred"
): ActionResult<never> {
  logError(context, error);
  return failure(userMessage);
}

/**
 * Common error messages for reuse
 */
export const ErrorMessages = {
  NOT_LOGGED_IN: "You must be logged in to perform this action",
  NOT_AUTHORIZED: "You are not authorized to perform this action",
  NOT_FOUND: (resource: string) => `${resource} not found`,
  FAILED_TO_CREATE: (resource: string) => `Failed to create ${resource}`,
  FAILED_TO_UPDATE: (resource: string) => `Failed to update ${resource}`,
  FAILED_TO_DELETE: (resource: string) => `Failed to delete ${resource}`,
  FAILED_TO_FETCH: (resource: string) => `Failed to fetch ${resource}`,
  INVALID_INPUT: "Invalid input provided",
  DATABASE_ERROR: "A database error occurred",
} as const;
