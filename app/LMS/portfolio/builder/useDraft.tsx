
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

  // Track whether we have checked localStorage
  const [isLoaded, setIsLoaded] = useState(false);

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
      }
    } catch (error) {
      console.error("Could not load portfolio draft:", error);
    } finally {
      setIsLoaded(true);
    }
  }, []);


  // Update student profile information
  const updateProfile = (
    changes: Partial<PortfolioContent["profile"]>
  ) => {
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

   const updateAvailability = (
    changes: Partial<PortfolioContent["availability"]>
  ) => {
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


  // Add a new project to the portfolio
  const addProject = () => {
    const newProject: PortfolioContent["projects"][number] = {
      id: crypto.randomUUID(),
      title: "",
      description: "",
      imageUrl: null,
      technologies: [],
    };

    setDraft((previous) => ({
      ...previous,
      content: {
        ...previous.content,
        projects: [...previous.content.projects, newProject],
      },
    }));
  };

  // Update a project using its ID
  const updateProject = (
    id: string,
    changes: Partial<PortfolioContent["projects"][number]>
  ) => {
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

  // Remove a project using its ID
  const removeProject = (id: string) => {
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


  // Update student contact information
  const updateContact = (
    changes: Partial<PortfolioContent["contact"]>
  ) => {
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
 
   
  // Change the portfolio design theme
  const setTheme = (theme: PortfolioContent["theme"]) => {
    setDraft((previous) => ({
      ...previous,
      content: {
        ...previous.content,
        theme,
      },
    }));
  };

  return {
    draft,
    isLoaded,
    updateProfile,
    updateAvailability,
    addProject,
    updateProject,
    removeProject,
    updateContact,
    setTheme,
};
}