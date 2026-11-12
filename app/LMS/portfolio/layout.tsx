import type { ReactNode } from "react";

// Issue #31: the Portfolio Builder's own content area.
// The existing app layout already renders the LMS header and main navigation.
export default function PortfolioLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <section
      aria-label="Portfolio builder workspace"
      style={{
        boxSizing: "border-box",
        width: "100%",
        minHeight: "100%",
        padding: "24px",
      }}
    >
      {children}
    </section>
  );
}
