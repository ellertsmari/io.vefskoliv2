import styles from "./SidePanel.module.css";
import { PORTFOLIO_STEPS, type PortfolioStepId } from "./steps";
import ProfileStep from "../steps/ProfileStep";
import ProjectsStep from "../steps/ProjectsStep";
import ThemeStep from "../steps/ThemeStep";
import ContactStep from "../steps/ContactStep";

type SidePanelProps = {
  activeStep: PortfolioStepId;
};

// The form fields for each step belong to their own GitHub tasks.
export default function SidePanel({ activeStep }: SidePanelProps) {
  const stepNumber = PORTFOLIO_STEPS.findIndex((step) => step.id === activeStep) + 1;
  const stepName = PORTFOLIO_STEPS[stepNumber - 1].label;

  let stepContent;
  let title;
  let description;

  if (activeStep === "profile") {
    stepContent = <ProfileStep />;
    title = "Tell your story";
    description = "This is shown on your About page. Keep it short — visitors skim.";
  } else if (activeStep === "projects") {
    stepContent = <ProjectsStep />;
    title = "Choose your best work";
    description = "Select projects from your course submissions. You can add up to six. Drag to change the order.";
  } else if (activeStep === "theme") {
    stepContent = <ThemeStep />;
    title = "Pick a look";
    description = "Your content stays the same — only the style changes. You can switch any time.";
  } else {
    stepContent = <ContactStep />;
    title = "Help them reach you";
    description = "Your CV and links appear in the footer of every page.";
  }

  return (
    <section className={styles.panel} aria-label="Portfolio step settings">
      <div className={styles.panelTitle}>PORTFOLIO BUILDER</div>
      <div className={styles.content}>
        <div className={styles.stepInfo}>
          <span>{String(stepNumber).padStart(2, "0")} — {activeStep === "contact" ? "CV & CONTACTS" : stepName.toUpperCase()}</span>
          <span className={styles.badge}>Step {stepNumber} of 4</span>
        </div>
        <h1 className={styles.heading}>{title}</h1>
        <p className={styles.description}>{description}</p>
        {activeStep === "profile" && (
          <div className={styles.welcome}>
            <strong>Welcome! Your portfolio starts empty.</strong>
            <p>Fill in the 4 steps — the preview updates as you go. Nothing is public until you publish.</p>
          </div>
        )}
        <div className={styles.placeholder}>{stepContent}</div>
      </div>
    </section>
  );
}
