/**
 * Icons for the dashboard widget headers. Same contract as the guide section
 * icons: a 24 grid at strokeWidth 1.5, no dimensions of their own, and
 * currentColor so the accent chip they sit in decides the colour.
 */

const iconProps = {
  fill: "none",
  viewBox: "0 0 24 24",
  strokeWidth: 1.5,
  stroke: "currentColor",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

/** Progress — bars climbing. */
export const ProgressIcon = () => (
  <svg {...iconProps}>
    <path d="M3 20.25h18M6.75 20.25v-6M12 20.25V7.5m5.25 12.75v-9" />
  </svg>
);

/** Grades — a graduation cap. */
export const GradesIcon = () => (
  <svg {...iconProps}>
    <path d="M12 3.75 2.25 8.25 12 12.75l9.75-4.5L12 3.75Z" />
    <path d="M6 10.5v5.25c0 .75 2.686 2.25 6 2.25s6-1.5 6-2.25V10.5M21 9v5.25" />
  </svg>
);

/** Score — a trophy. */
export const ScoreIcon = () => (
  <svg {...iconProps}>
    <path d="M8.25 3.75h7.5v5.25a3.75 3.75 0 0 1-7.5 0V3.75Z" />
    <path d="M8.25 5.25H5.625A1.125 1.125 0 0 0 4.5 6.375v.375a3 3 0 0 0 3 3h.75M15.75 5.25h2.625c.621 0 1.125.504 1.125 1.125v.375a3 3 0 0 1-3 3h-.75M12 12.75v3.75M9 20.25h6M10.5 16.5h3l.75 3.75h-4.5l.75-3.75Z" />
  </svg>
);

/** Give reviews — a bell, matching the notification on the guide cards. */
export const ReviewsIcon = () => (
  <svg {...iconProps}>
    <path d="M10.268 21a1.999 1.999 0 0 0 3.464 0M3.262 15.826a1 1 0 0 0 .865 1.174h15.746a1 1 0 0 0 .865-1.174C19.598 14.075 18 12.4 18 9A6 6 0 0 0 6 9c0 3.4-1.598 5.075-2.738 6.826Z" />
  </svg>
);

/** Continue learning — an open book. */
export const ContinueIcon = () => (
  <svg {...iconProps}>
    <path d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
  </svg>
);

/** Waiting — a clock, for the things that aren't in the student's hands. */
export const WaitingIcon = () => (
  <svg {...iconProps}>
    <path d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

/** All caught up — a tick. */
export const CaughtUpIcon = () => (
  <svg {...iconProps}>
    <path d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);
