
"use client";

import { useEffect, useState } from "react";
import type { LocalDraft, PortfolioContent } from "types/portfolioTypes";

const STORAGE_KEY = "portfolio-draft";

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

export function useDraft() {
  // Start with an empty portfolio
  const [draft, setDraft] = useState<LocalDraft>(() => ({
    content: createEmptyPortfolio(),
    savedAt: "",
    basedOn: null,
  }));

  // Track whether localStorage has been checked
  const [isLoaded, setIsLoaded] = useState(false);

  // Track unpublished local changes
  const [hasLocalChanges, setHasLocalChanges] = useState(false);

  // Load any previously saved draft
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (saved) {
        const localDraft = JSON.parse(saved) as LocalDraft;

        // Restore the availability date as a Date object
        const availableFrom = new Date(
          localDraft.content.availability.availableFrom
        );

        if (Number.isNaN(availableFrom.getTime())) {
          throw new Error("Invalid availability date");
        }

        setDraft({
          ...localDraft,
          content: {
            ...localDraft.content,
            availability: {
              ...localDraft.content.availability,
              availableFrom,
            },
          },
        });

        // The student already has a saved local draft
        setHasLocalChanges(true);
      }
    } catch (error) {
      console.error("Could not load portfolio draft:", error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // 1. Update student profile information
  const updateProfile = (
    changes: Partial<PortfolioContent["profile"]>
  ) => {
    setHasLocalChanges(true);

    setDraft((previous) => ({
      ...previous,
      content: {
        ...previous.content,
        profile: {
          ...previous.content.profile,
          ...changes,
        },
      },
    }));
  };

  // 2. Update internship availability
  const updateAvailability = (
    changes: Partial<PortfolioContent["availability"]>
  ) => {
    setHasLocalChanges(true);

    setDraft((previous) => ({
      ...previous,
      content: {
        ...previous.content,
        availability: {
          ...previous.content.availability,
          ...changes,
        },
      },
    }));
  };

  // 3. Add a new project
  const addProject = () => {
    const newProject: PortfolioContent["projects"][number] = {
      id: crypto.randomUUID(),
      title: "",
      description: "",
      imageUrl: null,
      technologies: [],
    };

    setHasLocalChanges(true);

    setDraft((previous) => ({
      ...previous,
      content: {
        ...previous.content,
        projects: [...previous.content.projects, newProject],
      },
    }));
  };

  // 4. Update an existing project
  const updateProject = (
    id: string,
    changes: Partial<PortfolioContent["projects"][number]>
  ) => {
    setHasLocalChanges(true);

    setDraft((previous) => ({
      ...previous,
      content: {
        ...previous.content,
        projects: previous.content.projects.map((project) =>
          project.id === id
            ? { ...project, ...changes, id: project.id }
            : project
        ),
      },
    }));
  };

  // 5. Remove a project
  const removeProject = (id: string) => {
    setHasLocalChanges(true);

    setDraft((previous) => ({
      ...previous,
      content: {
        ...previous.content,
        projects: previous.content.projects.filter(
          (project) => project.id !== id
        ),
      },
    }));
  };

  // 6. Update student contact information
  const updateContact = (
    changes: Partial<PortfolioContent["contact"]>
  ) => {
    setHasLocalChanges(true);

    setDraft((previous) => ({
      ...previous,
      content: {
        ...previous.content,
        contact: {
          ...previous.content.contact,
          ...changes,
        },
      },
    }));
  };

  // 7. Change the portfolio theme
  const setTheme = (theme: PortfolioContent["theme"]) => {
    setHasLocalChanges(true);

    setDraft((previous) => ({
      ...previous,
      content: {
        ...previous.content,
        theme,
      },
    }));
  };

  // Make the draft and editing functions available
  return {
    draft,
    isLoaded,
    hasLocalChanges,
    updateProfile,
    updateAvailability,
    addProject,
    updateProject,
    removeProject,
    updateContact,
    setTheme,
  };
}
