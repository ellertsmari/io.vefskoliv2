"use client";

import { useEffect } from "react";

/**
 * Last-resort boundary: this replaces the root layout, so it must render its
 * own <html>/<body> and cannot assume the styled-components registry or
 * globals.css loaded — a failure in either is exactly what lands here.
 *
 * The literal colours below are deliberate for that reason. They mirror
 * --primary-black-100/60 and --theme-module3-100; do not swap them for
 * var() references, which would resolve to nothing if the stylesheet is
 * missing and leave unreadable text.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem 1rem",
          fontFamily: "'Source Sans 3', system-ui, sans-serif",
          backgroundColor: "#ffffff",
          color: "#000000",
        }}
      >
        <main style={{ textAlign: "center", maxWidth: "32rem" }}>
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              margin: "0 0 0.75rem",
            }}
          >
            Something went wrong
          </h1>
          <p style={{ color: "#666666", lineHeight: 1.5, margin: "0 0 1.5rem" }}>
            The application failed to load. Refreshing usually fixes it — if it
            doesn&apos;t, please let a teacher know.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              border: "none",
              backgroundColor: "#000000",
              color: "#ffffff",
              fontSize: "0.875rem",
              cursor: "pointer",
            }}
          >
            TRY AGAIN
          </button>
          {error.digest && (
            <p style={{ fontSize: "0.75rem", color: "#b3b3b3", marginTop: "1.5rem" }}>
              Reference: {error.digest}
            </p>
          )}
        </main>
      </body>
    </html>
  );
}
