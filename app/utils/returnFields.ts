import { getDiscipline, type Discipline } from "./guideTaxonomy";

/**
 * What a return consists of, per discipline.
 *
 * A code guide is returned as a repository and a published page; a design
 * guide as a Figma file and a Figma prototype. The form, the reviewer's
 * links, the teacher's grading queue and the reports all read the labels
 * from here, so a student meets the same words everywhere. The stored
 * fields stay `projectUrl` and `liveVersion` whatever the discipline.
 *
 * No "use client"/"use server" directive: both sides import this.
 */

export type ReturnField = "projectUrl" | "liveVersion";

export type ReturnFieldSpec = {
  label: string;
  placeholder: string;
  /** How to get hold of the link, shown under the field. */
  hint: string;
};

export type ReturnFields = Record<ReturnField, ReturnFieldSpec>;

export const RETURN_FIELDS: Record<Discipline, ReturnFields> = {
  code: {
    projectUrl: {
      label: "GitHub repository",
      placeholder: "https://github.com/you/project",
      hint:
        "The address of your repository on GitHub — open it in the browser and copy the address bar. Make sure the repository is public.",
    },
    liveVersion: {
      label: "Live page",
      placeholder: "https://you.github.io/project",
      hint:
        "Where the project runs. Publish it with GitHub Pages (Settings → Pages in the repository), Vercel or Netlify, and paste the address it gives you.",
    },
  },
  design: {
    projectUrl: {
      label: "Figma file",
      placeholder: "https://www.figma.com/design/…",
      hint:
        "In Figma press Share, set access to “Anyone with the link” with “can view”, then Copy link.",
    },
    liveVersion: {
      label: "Figma prototype",
      placeholder: "https://www.figma.com/proto/…",
      hint:
        "Open your prototype with Present, press Share prototype and Copy link. Reviewers need this /proto link, not the file.",
    },
  },
};

type GuideLike = {
  discipline?: string | null;
  category?: string | null;
};

/** The field labels for a guide, from its discipline. */
export const returnFieldsFor = (guide: GuideLike): ReturnFields =>
  RETURN_FIELDS[getDiscipline(guide)];

const hostOf = (url: string): string | null => {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
};

const pathOf = (url: string): string => {
  try {
    return new URL(url).pathname;
  } catch {
    return "";
  }
};

const onHost = (host: string, wanted: string) =>
  host === wanted || host.endsWith(`.${wanted}`);

/**
 * A soft warning when a link is probably the wrong one for the field, or
 * undefined when it looks fine. Only a warning: a student may host code on
 * GitLab or a page on their own domain, and a wrong guess must not block
 * them. What it catches is the common mix-ups — a Figma link on a code
 * guide, the file link where the prototype belongs, the repository where
 * the live page belongs.
 */
export const linkWarning = (
  discipline: Discipline,
  field: ReturnField,
  url: string
): string | undefined => {
  const trimmed = url.trim();
  if (!trimmed) return undefined;
  const host = hostOf(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
  if (!host) return undefined;
  const path = pathOf(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
  const isFigma = onHost(host, "figma.com");

  if (discipline === "code") {
    if (field === "projectUrl") {
      if (isFigma) return "That is a Figma link. A code guide is returned with the repository.";
      if (!onHost(host, "github.com")) {
        return "This doesn't look like a GitHub link. Double-check it before you submit.";
      }
      return undefined;
    }
    if (onHost(host, "github.com")) {
      return "That looks like the repository. The live page is the published site, for example on GitHub Pages.";
    }
    if (isFigma) return "That is a Figma link. A code guide needs a published page here.";
    return undefined;
  }

  // design
  if (!isFigma) {
    return "This doesn't look like a Figma link. Double-check it before you submit.";
  }
  if (field === "projectUrl" && path.startsWith("/proto/")) {
    return "That is the prototype link. The file link goes here; the prototype has its own field below.";
  }
  if (field === "liveVersion" && !path.startsWith("/proto/")) {
    return "That is the file link. Open Present, then Share prototype, to get the /proto link.";
  }
  return undefined;
};
