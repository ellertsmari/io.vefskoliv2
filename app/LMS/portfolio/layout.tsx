import type { ReactNode } from "react";
import styles from "./layout.module.css";

// The Portfolio Builder uses its own header and step navigation.
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
