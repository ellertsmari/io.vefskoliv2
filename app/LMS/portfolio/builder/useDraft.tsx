
"use client";

import type { PortfolioContent } from "types/portfolioTypes";

// Starting point for a student who has no portfolio yet.
function createEmptyPortfolio(): PortfolioContent {
  return {
    profile: {
      name: "",
      headline: "",
      tagline: "",
      about: "",
      photoUrl: null,
      location: "",
      skills: [],
      languages: [],
    },

    availability: {
      openToInternships: false,
      availableFrom: new Date(),
      lookingFor: "",
    },

    projects: [],

    contact: {
      email: "",
      linkedinUrl: "",
      githubUrl: "",
      cvUrl: "",
    },

    theme: "editorial",
  };
}
