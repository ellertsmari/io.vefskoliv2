"use client";

import { useState } from "react";
import styles from "./portfolio.module.css";
import TopBar from "./builder/TopBar";
import StepRail from "./builder/StepRail";
import SidePanel from "./builder/SidePanel";
import DemoPortfolio from "./DemoPortfolio";
import type { PortfolioStepId } from "./builder/steps";

export default function PortfolioBuilderPage() {
  const [activeStep, setActiveStep] = useState<PortfolioStepId>("profile");

  return (
    <main className={styles.builder} aria-label="Portfolio Builder">
      <TopBar />

      <div className={styles.workspace}>
        <StepRail activeStep={activeStep} onStepChange={setActiveStep} />
        <SidePanel activeStep={activeStep} />

        <section className={styles.preview} aria-label="Portfolio demo preview">
          <div className={styles.previewToolbar}>
            <span className={styles.liveLabel}>
              <span className={styles.liveDot} aria-hidden="true" />
              Live preview
               <span className={styles.previewHint}>Changes appear instantly</span>
            </span>
            <div className={styles.deviceButtons} aria-label="Preview device options">
              <button type="button" disabled title="Desktop preview coming later" aria-label="Desktop preview">▣</button>
              <button type="button" disabled title="Mobile preview coming later" aria-label="Mobile preview">▯</button>
            </div>
          </div>

          <div className={styles.previewBody}>
            <DemoPortfolio />
          </div>

          <div className={styles.themeBar} aria-label="Preview theme options">
            <span>Theme</span>
            <div className={styles.themeButtons}>
              <button type="button" disabled className={styles.selectedTheme}>● Editorial</button>
              <button type="button" disabled>● Minimal</button>
              <button type="button" disabled>○ Studio</button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
