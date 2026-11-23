"use client";
import { useDraft } from "./builder/useDraft";
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
  const { 
    draft, 
    isLoaded, 
    hasLocalChanges, 
    error,
  } = useDraft();

  const [publicationStatus, setPublicationStatus] = useState(
    "Checking publication status..."
  );

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
      <p role="status">
        {!isLoaded
          ? "Loading draft..."
          : error
            ? error
            : hasLocalChanges
              ? `Local draft: ${draft.content.profile.name || "Unnamed portfolio"}`
              : "Ready to edit"}
      </p>

      <div className={styles.workspace}>
        <StepRail activeStep={activeStep} onStepChange={setActiveStep} />
        <SidePanel activeStep={activeStep} />
        <Preview />
      </div>
    </main>
  );
}
