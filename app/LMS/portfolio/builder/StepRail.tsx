"use client";

import Image from "next/image";
import profileIcon from "public/portfolio/icons/profile.svg";
import projectsIcon from "public/portfolio/icons/projects.svg";
import themeIcon from "public/portfolio/icons/theme.svg";
import contactIcon from "public/portfolio/icons/contact.svg";
import styles from "./StepRail.module.css";
import { PORTFOLIO_STEPS, type PortfolioStepId } from "./steps";

type StepRailProps = {
  activeStep: PortfolioStepId;
  onStepChange: (step: PortfolioStepId) => void;
};

// These icons come from the Portfolio Builder Figma design.
const stepIcons = {
  profile: profileIcon,
  projects: projectsIcon,
  theme: themeIcon,
  contact: contactIcon,
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
            <Image src={stepIcons[step.id]} width={18} height={18} alt="" />
          </span>
          <span className={styles.stepLabel}>{step.label}</span>
        </button>
      ))}
    </nav>
  );
}
