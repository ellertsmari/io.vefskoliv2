/**
 * One icon per guide section. Same contract as assets/Icons.tsx — a 24 grid at
 * strokeWidth 1.5 with round caps — and no dimensions of their own, so the chip
 * they sit in decides the size and `currentColor` picks up its state.
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

/** Description — a page of text. */
export const DescriptionIcon = () => (
  <svg {...iconProps}>
    <path d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5A3.375 3.375 0 0 0 10.125 2.25H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    <path d="M8.25 13.5h7.5M8.25 17.25h4.5" />
  </svg>
);

/** Topics — a list of what is covered. */
export const TopicsIcon = () => (
  <svg {...iconProps}>
    <path d="M8.25 6.75h12M8.25 12h12M8.25 17.25h12M3.75 6.75h.008v.008H3.75V6.75ZM3.75 12h.008v.008H3.75V12Zm0 5.25h.008v.008H3.75v-.008Z" />
  </svg>
);

/** Goals — a target to hit. */
export const GoalsIcon = () => (
  <svg {...iconProps}>
    <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />
    <path d="M12 16.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Z" />
    <path d="M12 12h.008v.008H12V12Z" />
  </svg>
);

/** Requirements — what has to be delivered. */
export const RequirementsIcon = () => (
  <svg {...iconProps}>
    <path d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
  </svg>
);

/** Materials — things to read. */
export const MaterialsIcon = () => (
  <svg {...iconProps}>
    <path d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
  </svg>
);

/** Snap to grid — a four-pane grid. */
export const GridIcon = () => (
  <svg {...iconProps}>
    <path d="M3.75 3.75h16.5v16.5H3.75zM12 3.75v16.5M3.75 12h16.5" />
  </svg>
);

/** Minimise — the window-chrome minus. */
export const MinimizeIcon = () => (
  <svg {...iconProps}>
    <path d="M6 18.75h12" />
  </svg>
);

/** Auto arrange — panels tidied into a layout. */
export const ArrangeIcon = () => (
  <svg {...iconProps}>
    <path d="M3.75 3.75h6.75v16.5H3.75zM13.5 3.75h6.75v6.75H13.5zM13.5 13.5h6.75v6.75H13.5z" />
  </svg>
);

/** Reset — a counter-clockwise restore arrow. */
export const ResetIcon = () => (
  <svg {...iconProps}>
    <path d="M9.348 14.652a3.75 3.75 0 0 1 0-5.304m5.304 0a3.75 3.75 0 0 1 0 5.304m-7.425 2.121a6.75 6.75 0 0 1 0-9.546m9.546 0a6.75 6.75 0 0 1 0 9.546M5.106 18.894c-3.808-3.807-3.808-9.98 0-13.788m13.788 0c3.808 3.807 3.808 9.98 0 13.788" />
  </svg>
);

/** Drag handle — the usual six-dot grip. */
export const GripIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <circle cx="9" cy="6" r="1.6" />
    <circle cx="15" cy="6" r="1.6" />
    <circle cx="9" cy="12" r="1.6" />
    <circle cx="15" cy="12" r="1.6" />
    <circle cx="9" cy="18" r="1.6" />
    <circle cx="15" cy="18" r="1.6" />
  </svg>
);

/** Submit — hand your work in. */
export const SubmitIcon = () => (
  <svg {...iconProps}>
    <path d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" />
  </svg>
);
