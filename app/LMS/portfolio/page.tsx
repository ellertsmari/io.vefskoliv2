"use client";

import { useEffect, useState } from "react";
import styles from "./portfolio.module.css";
import TopBar from "./builder/TopBar";
import StepRail from "./builder/StepRail";
import SidePanel from "./builder/SidePanel";
import Preview from "./builder/Preview";
import type { PortfolioStepId } from "./builder/steps";
import { getMyPortfolio } from "serverActions/portfolio/getMyPortfolio";

export default function PortfolioBuilderPage() {
  const [activeStep, setActiveStep] = useState<PortfolioStepId>("profile");
  const [publicationStatus, setPublicationStatus] = useState("Checking publication status...");

  useEffect(() => {
    let active = true;

    async function loadPortfolioStatus() {
      try {
        const result = await getMyPortfolio();
        if (!active) return;

        if (!result.success) {
          setPublicationStatus("Status unavailable");
        } else if (!result.data) {
          setPublicationStatus("Not published yet");
        } else if (result.data.visibility === "public") {
          setPublicationStatus("Published");
        } else {
          setPublicationStatus("Hidden");
        }
      } catch {
        if (active) {
          setPublicationStatus("Status unavailable");
        }
      }
    }

    void loadPortfolioStatus();

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className={styles.builder} aria-label="Portfolio Builder">
      <TopBar status={publicationStatus} />

      <div className={styles.workspace}>
        <StepRail activeStep={activeStep} onStepChange={setActiveStep} />
        <SidePanel activeStep={activeStep} />
        <Preview />
      </div>
    </main>
  );
}
