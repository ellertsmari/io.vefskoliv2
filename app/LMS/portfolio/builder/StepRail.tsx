"use client";

import styles from "./StepRail.module.css";
import { PORTFOLIO_STEPS, type PortfolioStepId } from "./steps";

type StepRailProps = {
  activeStep: PortfolioStepId;
  onStepChange: (step: PortfolioStepId) => void;
};

// These icons come from the Portfolio Builder Figma design.
const stepIcons = {
  profile: "/portfolio/icons/profile.svg",
  projects: "/portfolio/icons/projects.svg",
  theme: "/portfolio/icons/theme.svg",
  contact: "/portfolio/icons/contact.svg",
};

export default function StepRail({ activeStep, onStepChange }: StepRailProps) {
  return (
    <nav className={styles.rail} aria-label="Portfolio builder steps">
      {PORTFOLIO_STEPS.map((step) => (
        <button
          key={step.id}
          type="button"
          className={activeStep === step.id
            ? `${styles.stepButton} ${styles.active}`
            : styles.stepButton}
          aria-current={activeStep === step.id ? "step" : undefined}
          onClick={() => onStepChange(step.id)}
        >
          <span className={styles.iconBox}>
            <img src={stepIcons[step.id]} width="18" height="18" alt="" />
          </span>
          <span className={styles.stepLabel}>{step.label}</span>
        </button>
      ))}
    </nav>
  );
}
