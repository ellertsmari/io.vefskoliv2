
"use client";

import type { LocalDraft, PortfolioContent } from "types/portfolioTypes";
import { getMyPortfolio } from "serverActions/portfolio/getMyPortfolio";
import { useCallback, useEffect, useState } from "react";
import { getPortfolioStudentId } from "serverActions/portfolio/getPortfolioStudentId";
const STORAGE_KEY = "portfolio-draft";

// Starting portfolio for a new student
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
  // Current portfolio draft
  const [draft, setDraft] = useState<LocalDraft>(() => ({
    content: createEmptyPortfolio(),
    savedAt: "",
    basedOn: null,
  }));

  // Has localStorage been checked?
  const [isLoaded, setIsLoaded] = useState(false);
  const [storageKey, setStorageKey] = useState<string | null>(null);
  // Does the student have unpublished changes?
  const [hasLocalChanges, setHasLocalChanges] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  // Error when loading or saving a local draft
  const [error, setError] = useState<string | null>(null);

  // Load an existing local draft when the hook starts
  
  // Load the local draft first, or the published portfolio
  useEffect(() => {
    let active = true;

    async function loadDraft() {
      try {
        
        // Find out which student is logged in
        const studentId = await getPortfolioStudentId();

        if (!active) return;

        if (!studentId) {
            setError("Please sign in to edit your portfolio.");
            return;
        }

        // Create a different localStorage key for each student
        const key = `${STORAGE_KEY}:${studentId}`;

        setStorageKey(key);

        // Check only this student's saved draft
        const saved = localStorage.getItem(key);
        
        if (saved) {
          const localDraft = JSON.parse(saved) as LocalDraft;

          const availableFrom = new Date(
            localDraft.content.availability.availableFrom
          );

          if (Number.isNaN(availableFrom.getTime())) {
            throw new Error("Invalid availability date");
          }

          if (!active) return;

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

          setHasLocalChanges(true);
          return;
        }

        // No local draft? Load the portfolio from the server
        const result = await getMyPortfolio();

        if (!active) return;

        if (!result.success) {
          setError("Could not load your published portfolio.");
          return;
        }

        if (result.data) {
          const availableFrom = new Date(
            result.data.content.availability.availableFrom
          );

          if (Number.isNaN(availableFrom.getTime())) {
            throw new Error("Invalid availability date");
          }

          setDraft({
            content: {
              ...result.data.content,
              availability: {
                ...result.data.content.availability,
                availableFrom,
              },
            },
            savedAt: "",
            basedOn: result.data.updatedAt,
          });
        }
      } catch (error) {
        if (active) {
          console.error("Could not load portfolio:", error);
          setError("Could not load your portfolio draft.");
        }
      } finally {
        if (active) {
          setIsLoaded(true);
        }
      }
    }

    void loadDraft();

    return () => {
      active = false;
    };
  }, []);

  // 1. Update profile
  const updateProfile = (
    changes: Partial<PortfolioContent["profile"]>
  ) => {
    setHasLocalChanges(true);

    setDraft((previous) => ({
      ...previous,
      savedAt: new Date().toISOString(),
      content: {
        ...previous.content,
        profile: {
          ...previous.content.profile,
          ...changes,
        },
      },
    }));
  };

  // 2. Update availability
  const updateAvailability = (
    changes: Partial<PortfolioContent["availability"]>
  ) => {
    setHasLocalChanges(true);

    setDraft((previous) => ({
      ...previous,
      savedAt: new Date().toISOString(),
      content: {
        ...previous.content,
        availability: {
          ...previous.content.availability,
          ...changes,
        },
      },
    }));
  };

  // 3. Add a project
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
      savedAt: new Date().toISOString(),
      content: {
        ...previous.content,
        projects: [...previous.content.projects, newProject],
      },
    }));
  };

  // 4. Update a project
  const updateProject = (
    id: string,
    changes: Partial<PortfolioContent["projects"][number]>
  ) => {
    setHasLocalChanges(true);

    setDraft((previous) => ({
      ...previous,
      savedAt: new Date().toISOString(),
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
      savedAt: new Date().toISOString(),
      content: {
        ...previous.content,
        projects: previous.content.projects.filter(
          (project) => project.id !== id
        ),
      },
    }));
  };

  // 6. Update contact information
  const updateContact = (
    changes: Partial<PortfolioContent["contact"]>
  ) => {
    setHasLocalChanges(true);

    setDraft((previous) => ({
      ...previous,
      savedAt: new Date().toISOString(),
      content: {
        ...previous.content,
        contact: {
          ...previous.content.contact,
          ...changes,
        },
      },
    }));
  };

  // 7. Change portfolio theme
  const setTheme = (theme: PortfolioContent["theme"]) => {
    setHasLocalChanges(true);

    setDraft((previous) => ({
      ...previous,
      savedAt: new Date().toISOString(),
      content: {
        ...previous.content,
        theme,
      },
    }));
  };

  // 8. Save the draft to localStorage only
  
  const saveDraft = useCallback(() => {
    if (!isLoaded || !storageKey) return;

    try {
      // Save the draft immediately in the browser
      localStorage.setItem(storageKey, JSON.stringify(draft));

      // Clear an earlier storage error asynchronously
      queueMicrotask(() => {
        setError((current) =>
          current === "Could not save your draft in this browser."
            ? null
            : current
        );
      });
    } catch (error) {
      console.error("Could not save portfolio draft:", error);

      // Report the storage error asynchronously
      queueMicrotask(() => {
        setError("Could not save your draft in this browser.");
      });
    }
  }, [draft, isLoaded, storageKey]);


  // Automatically save whenever the student makes changes
  useEffect(() => {
    if (!isLoaded || !hasLocalChanges) return;

    saveDraft();
  }, [draft, isLoaded, hasLocalChanges, saveDraft]);

  // Temporary until Issue #38's publishing action is available
  const publishDraft = async (): Promise<boolean> => {
    setIsPublishing(true);

    try {
      setError("Publishing is not available yet. Waiting for Issue #38.");
      return false;
    } finally {
      setIsPublishing(false);
    }
  };

  return {
    draft,
    isLoaded,
    hasLocalChanges,
    error,
    updateProfile,
    updateAvailability,
    addProject,
    updateProject,
    removeProject,
    updateContact,
    setTheme,
    saveDraft,
    isPublishing,
    publishDraft,
  };
}
