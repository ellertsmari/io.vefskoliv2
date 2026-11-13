import type { Types } from "mongoose";

/**
 * A project displayed in the portfolio.
 */
export type PortfolioProject = {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null; // URL from the existing upload
  technologies: string[];
  // Optional project links
  liveUrl?: string;
  githubUrl?: string;
};

/**
 * PortfolioContent
 * The information students can edit.
 * Shared between the draft and published portfolio.
 */
export type PortfolioContent = {
  profile: {
    name: string;
    headline: string;
    tagline: string;
    about: string;
    photoUrl: string | null;
    location: string;
    skills: string[];
    languages: string[];
  };

  availability: {
    openToInternships: boolean;
    availableFrom: Date;
    lookingFor: string;
  };

  projects: PortfolioProject[];

  contact: {
    email?: string;
    linkedinUrl?: string;
    githubUrl?: string;
  };

  theme: PortfolioTheme;
};

/**
 * LocalDraft
 *
 * Stored in the student's browser.
 * Date values are ISO strings in localStorage.
 */
export type LocalDraft = {
  content: PortfolioContent;
  savedAt: string;
  basedOn: string | null;
};

/**
 * Portfolio
 *
 * Published portfolio stored in the
 * MongoDB "portfolios" collection.
 */
export type Portfolio = {
  _id: Types.ObjectId;
  studentId: Types.ObjectId;
  slug: string;
  visibility: "public" | "hidden";
  publishedAt: Date;
  updatedAt: Date;
  content: PortfolioContent;
};

/**
 * PublicPortfolio
 *
 * Contains only the information needed
 * to display the portfolio.
 *
 * No database IDs or internal metadata.
 */
export type PublicPortfolio = {
  content: PortfolioContent;
};

/**
 * Available portfolio themes.
 */
export type PortfolioTheme =
  | "editorial"
  | "minimal"
  | "studio";