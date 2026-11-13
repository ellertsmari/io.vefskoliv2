import { z } from "zod";

/**
 * A link a person typed that the site later renders as an `href`.
 *
 * zod's `.url()` only checks that the value parses as a URL, so on its own it
 * accepts `javascript:alert(1)` and `data:text/html,…` — addresses that run
 * code or open arbitrary content when someone clicks them. Every stored link
 * goes through this schema instead. It makes one check, so a bad value gets
 * one error message: the value must parse as a URL and be http: or https:.
 *
 * No "use client"/"use server" directive, so forms, server actions and tests
 * can all import it.
 */
export const WEB_LINK_MAX_LENGTH = 2000;

const DEFAULT_MESSAGE = "Please enter a full link, including https://";

/** True for an absolute http: or https: address and nothing else. */
export const isWebLink = (value: string): boolean => {
  try {
    const { protocol } = new URL(value);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
};

export const webLink = (message: string = DEFAULT_MESSAGE) =>
  z
    .string()
    .trim()
    .max(WEB_LINK_MAX_LENGTH, `Keep the link under ${WEB_LINK_MAX_LENGTH} characters`)
    .refine(isWebLink, message);
