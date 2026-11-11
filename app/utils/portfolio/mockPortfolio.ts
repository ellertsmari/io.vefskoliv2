
import type { Types } from "mongoose";

import type {
  PortfolioContent,
  LocalDraft,
  Portfolio,
  PublicPortfolio,
} from "types/portfolioTypes";

/**
 * Mock ObjectIds.
 *
 * These are strings cast for mock typing only.
 * They are NOT real Mongoose ObjectId instances.
 * Do not use them for database operations.
 */
const mockId = (id: string): Types.ObjectId =>
  id as unknown as Types.ObjectId;

/**
 * Example portfolio content.
 */
export const mockPortfolioContent: PortfolioContent = {
  profile: {
    name: "Anna Jónsdóttir",
    headline: "Frontend developer.",
    tagline: "Creative thinker.",

    about:
      "I'm a frontend student at Vefskólinn. " +
      "I enjoy turning designs into accessible, " +
      "responsive websites and I care about " +
      "the small details that make them feel finished.",

    photoUrl: null,

    location: "Reykjavík, Iceland",

    skills: [
      "HTML",
      "CSS",
      "JavaScript",
      "TypeScript",
      "React",
      "Figma",
    ],

    languages: ["Icelandic", "English"],
  },

  availability: {
    openToInternships: true,
    availableFrom: new Date("2027-01-01T00:00:00.000Z"),
    lookingFor: "Frontend / UI internship",
  },

  projects: [
    {
      id: "project-01",
      title: "Nordic Trails",
      description:
        "A small travel guide for hiking routes in Iceland.",
      imageUrl: null,
      technologies: ["HTML", "CSS", "JavaScript"],
    },

    {
      id: "project-02",
      title: "Form / Function",
      description:
        "An editorial study exploring structure, rhythm, " +
        "and typography systems for the screen.",
      imageUrl: null,
      technologies: ["Figma", "CSS", "React"],
    },

    {
      id: "project-03",
      title: "Field Notes",
      description:
        "A lightweight field journal for collecting " +
        "visual references, places, and observations.",
      imageUrl: null,
      technologies: ["React", "JavaScript", "CSS"],
    },

    {
      id: "project-04",
      title: "Space Between",
      description:
        "A digital exhibition concept shaped around " +
        "quiet transitions and generous negative space.",
      imageUrl: null,
      technologies: ["3D", "React", "CSS"],
    },
  ],

  contact: {
    email: "anna@example.com",
    linkedinUrl: "https://www.linkedin.com/",
    githubUrl: "https://github.com/",
  },

  theme: "editorial",
};

/**
 * Published portfolio.
 *
 * Represents data stored in the database.
 */
export const mockPortfolio: Portfolio = {
  _id: mockId("507f191e810c19729de860ea"),

  studentId: mockId("507f191e810c19729de860eb"),

  slug: "anna-jonsdottir",

  visibility: "public",

  publishedAt: new Date("2026-11-05T12:00:00.000Z"),

  updatedAt: new Date("2026-11-05T12:00:00.000Z"),

  content: mockPortfolioContent,
};

/**
 * Student's local draft.
 *
 * The tagline has been edited locally,
 * but these changes are not yet published.
 */
export const mockLocalDraft: LocalDraft = {
  content: {
    ...mockPortfolioContent,

    profile: {
      ...mockPortfolioContent.profile,

      tagline:
        "Building accessible digital experiences.",
    },
  },

  savedAt: "2026-11-11T14:00:00.000Z",

  basedOn: mockPortfolio.publishedAt.toISOString(),
};

/**
 * Public portfolio data.
 *
 * Includes only the content needed
 * by PortfolioView.
 */
export const mockPublicPortfolio: PublicPortfolio = {
  content: mockPortfolio.content,
};
