import type { ProjectBrief } from "constants/projectBrief";

export const theFundamentals: ProjectBrief = {
  module: 3,
  slug: "the-fundamentals",
  title: "The Fundamentals",
  tagline: "An interactive web application built from the fundamentals — no frameworks, no libraries, just the web and TypeScript.",
  teamSize: "3–4 students",
  updated: "2026-11-04",
  theme: {
    heroBackground: "#111111",
    heroText: "#fafafa",
    background: "#f4f4f0",
    surface: "#ffffff",
    text: "#111111",
    muted: "#5a5a5a",
    accent: "#c8221b",
    accentText: "#ffffff",
    headingFont: "Archivo",
    bodyFont: "Inter",
  },

  mission: {
    statement: "Frameworks come and go. The fundamentals stay. This project is about knowing them cold.",
    paragraphs: [
      "Each group creates an **interactive web application** using the fundamental web technologies and the tools of the **Design Thinking** ideology.",
      "Agile methods — user stories, a backlog, status meetings and sprints — organise the group work.",
    ],
    goals: [
      {
        icon: "mdi:head-lightbulb-outline",
        title: "Think like a designer",
        text: "User research, testing and a full design hand-off, the Design Thinking way.",
      },
      {
        icon: "mdi:language-typescript",
        title: "Vanilla TypeScript",
        text: "Functions, arrays, objects and loops — no JavaScript frameworks or libraries.",
      },
      {
        icon: "mdi:source-branch",
        title: "Work like a team",
        text: "User stories, a backlog, sprints, and a Git repository everyone commits to.",
      },
      {
        icon: "mdi:earth",
        title: "Live for everyone",
        text: "The finished product is online, open to the general public.",
      },
    ],
  },

  requirements: [
    {
      label: "Design hand-off",
      icon: "mdi:palette-outline",
      items: [
        "User research.",
        "A moodboard.",
        "A lo-fi prototype: sketches or wireframes.",
        "User testing.",
        "A UI style guide: colours, typography, grids, components and iconography.",
        "The final UI design.",
      ],
    },
    {
      label: "Code",
      icon: "mdi:code-tags",
      items: [
        "HTML and CSS or Tailwind.",
        "Pure (vanilla) **TypeScript**: functions, arrays, objects and loops.",
        "**No JavaScript frameworks or libraries.**",
        "Delivered as a Git repository.",
      ],
    },
    {
      label: "Way of working",
      icon: "mdi:account-group-outline",
      items: [
        "Design Thinking tools for the product.",
        "Agile for the team: user stories, backlog, status meetings, sprints.",
      ],
    },
    {
      label: "Product",
      icon: "mdi:rocket-launch-outline",
      items: ["The final product must be **available online** for the general public."],
    },
  ],
  handIn: [
    "The live application, at a public URL",
    "The Git repository",
    "The design hand-off in Figma",
    "Your presentation, on presentation day",
  ],

  ideas: [
    {
      icon: "mdi:target",
      title: "A focus or task tracker",
      text: "Help someone get through their day, one task at a time.",
    },
    {
      icon: "mdi:palette-swatch-variant",
      title: "A colour-scheme generator",
      text: "Palettes that work, for people who are not designers.",
    },
    {
      icon: "mdi:music-note-plus",
      title: "A music-making app",
      text: "Beats, loops or melodies, right in the browser.",
    },
  ],
  ideasNote: "Your own idea is welcome too — talk to your teachers first.",

  phases: [
    {
      title: "Empathise & define",
      icon: "mdi:account-search-outline",
      weight: 2,
      text: "Who is this for, and what is their problem?",
      tasks: ["User research and interviews", "Problem statement", "User stories and backlog", "Moodboard"],
    },
    {
      title: "Ideate & prototype",
      icon: "mdi:draw",
      weight: 2,
      text: "Sketch it, test it, then design it properly.",
      tasks: ["Sketches or wireframes", "User testing", "Style guide", "Hi-fi prototype"],
    },
    {
      title: "Build",
      icon: "mdi:code-tags",
      weight: 4,
      text: "Vanilla TypeScript, in sprints, with branches and code review.",
      tasks: ["File structure agreed", "Features from user stories", "Commit at least daily", "Review each other's code"],
    },
    {
      title: "Ship & rehearse",
      icon: "mdi:presentation-play",
      weight: 1,
      text: "Online, polished and practised.",
      tasks: ["Deploy", "QR code so the audience can try it", "Pick and rehearse the live-coding piece"],
    },
  ],

  presentation: [
    {
      title: "Introduction",
      minutes: 5,
      text: "The group, the audience tries the app (QR code!), a demo, and how you worked.",
      criteria: ["trying-it-out", "product-demo", "work-organization", "task-to-feature", "tools-tech-stack"],
    },
    {
      title: "Design",
      minutes: 7,
      text: "The Design Thinking journey, from research to the hi-fi prototype.",
      criteria: [
        "ux-design-thinking-tools",
        "user-research",
        "discoveries",
        "user-testing",
        "moodboard",
        "wireframe",
        "style-guide",
        "hifi-prototype",
      ],
    },
    {
      title: "Programming",
      minutes: 10,
      text: "The code, live, and how you kept it in order together.",
      criteria: [
        "file-structure",
        "variable-names",
        "documentation",
        "live-coding-quality",
        "live-coding-clarity",
        "gh-branches",
        "gh-commits",
        "gh-code-review",
      ],
    },
    {
      title: "Q&A",
      minutes: 8,
      text: "Questions from the judges and the audience.",
      criteria: ["answering-questions", "presentation-overall"],
    },
  ],
  presentationNote: "The project finishes with a retro meeting.",

  faq: [
    {
      question: "Can we use React, or a library like jQuery?",
      answer: "No. This project is pure TypeScript — no JavaScript frameworks or libraries. Tailwind is allowed for styling.",
    },
    {
      question: "Can we pick our own idea?",
      answer: "Yes, but talk to your teachers first.",
    },
    {
      question: "Does the product have to be online?",
      answer: "Yes. The final product must be available online for the general public, and the audience tries it during the presentation.",
    },
    {
      question: "How is my own grade worked out?",
      answer: "From your team's result and how your teammates rate your contribution and teamwork. Try it in the grading section above.",
    },
  ],
};
