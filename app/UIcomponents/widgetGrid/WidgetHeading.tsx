"use client";

import { useId, useState } from "react";
import {
  WidgetHeader,
  WidgetHeaderActions,
  WidgetHeaderText,
  WidgetHelpButton,
  WidgetHelpText,
  WidgetIcon,
  WidgetTitle,
} from "./style";

type Props = {
  title: string;
  /** Name of the --accent-* family this widget is identified by. */
  accent: string;
  icon: React.ReactNode;
  /** Explanation, hidden behind the question mark. Omit for no help button. */
  help?: React.ReactNode;
  /** Controls sitting beside the question mark, e.g. a walkthrough trigger. */
  actions?: React.ReactNode;
  /** Extra content under the title that should always be on screen. */
  children?: React.ReactNode;
};

/**
 * A widget's header: icon, title, and its explanation tucked behind a question
 * mark. Built as a component rather than left to each widget so that every
 * widget gets the same disclosure wiring — the button and the text it reveals
 * have to agree on an id, and doing that by hand seven times invites drift.
 */
export const WidgetHeading = ({
  title,
  accent,
  icon,
  help,
  actions,
  children,
}: Props) => {
  const [showHelp, setShowHelp] = useState(false);
  const helpId = useId();

  return (
    <WidgetHeader>
      <WidgetIcon $accent={accent}>{icon}</WidgetIcon>
      <WidgetHeaderText>
        <WidgetTitle>{title}</WidgetTitle>
        {/* Rendered even when closed, just hidden: aria-controls has to point
            at an element that exists, or the button advertises a relationship
            to nothing. `hidden` keeps it out of layout and the a11y tree. */}
        {help && (
          <WidgetHelpText id={helpId} hidden={!showHelp}>
            {help}
          </WidgetHelpText>
        )}
        {children}
      </WidgetHeaderText>
      {(actions || help) && (
        <WidgetHeaderActions>
          {actions}
          {help && (
            <WidgetHelpButton
              type="button"
              aria-expanded={showHelp}
              aria-controls={helpId}
              aria-label={`What does ${title} show?`}
              onClick={() => setShowHelp((open) => !open)}
            >
              ?
            </WidgetHelpButton>
          )}
        </WidgetHeaderActions>
      )}
    </WidgetHeader>
  );
};
