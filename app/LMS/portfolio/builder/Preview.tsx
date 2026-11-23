"use client";

import { useState } from "react";
import { PortfolioView } from "app/components/portfolio/view/PortfolioView";
import { mockPublicPortfolio } from "app/utils/portfolio/mockPortfolio";
import type { PublicPortfolio } from "types/portfolioTypes";
import styles from "./Preview.module.css";

type PreviewProps = {
  portfolio?: PublicPortfolio;
};

export default function Preview({ portfolio = mockPublicPortfolio }: PreviewProps) {
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");

  return (
    <section className={styles.preview} aria-label="Portfolio preview">
      <div className={styles.toolbar}>
        <div className={styles.previewLabel}>
          <span className={styles.dot} aria-hidden="true" />
          Portfolio preview
          <span className={styles.sampleLabel}>Sample data until your draft is connected</span>
        </div>
        <div className={styles.devices} role="group" aria-label="Preview device options">
          <button
            type="button"
            aria-pressed={device === "desktop"}
            onClick={() => setDevice("desktop")}
          >
            Desktop
          </button>
          <button
            type="button"
            aria-pressed={device === "mobile"}
            onClick={() => setDevice("mobile")}
          >
            Mobile
          </button>
        </div>
      </div>

      <div className={styles.previewBody}>
        <div className={device === "mobile" ? styles.mobile : styles.desktop} data-device={device}>
          <PortfolioView portfolio={portfolio} />
        </div>
      </div>

      <div className={styles.themeBar} aria-label="Preview theme options">
        <span>Theme</span>
        <div className={styles.themeButtons}>
          <button type="button" disabled className={styles.selectedTheme}>Editorial</button>
          <button type="button" disabled>Minimal</button>
          <button type="button" disabled>Studio</button>
        </div>
      </div>
    </section>
  );
}
