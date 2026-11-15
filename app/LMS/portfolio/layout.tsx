import type { ReactNode } from "react";
import styles from "./layout.module.css";

// The main LMS layout already includes the header and navigation.
export default function PortfolioLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <section className={styles.layout} aria-label="Portfolio builder workspace">
      {children}
    </section>
  );
}
