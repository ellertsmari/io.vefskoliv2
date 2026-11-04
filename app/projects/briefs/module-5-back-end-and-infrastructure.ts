import type { ProjectBrief } from "constants/projectBrief";

export const backEndAndInfrastructure: ProjectBrief = {
  module: 5,
  slug: "back-end-and-infrastructure",
  title: "Back End and Infrastructure",
  tagline: "The whole class, one open-source project: new features with a real back end, delivered as a pull request.",
  teamSize: "One team of everyone",
  updated: "2026-11-04",
  theme: {
    heroBackground: "#06110c",
    heroText: "#c8f7d4",
    background: "#f1f6f2",
    surface: "#ffffff",
    text: "#0c1a14",
    muted: "#4c5e55",
    accent: "#17784a",
    accentText: "#ffffff",
    headingFont: "JetBrains Mono",
    bodyFont: "IBM Plex Sans",
  },

  mission: {
    statement: "Real developers spend most of their time in code somebody else wrote. Time to join them.",
    paragraphs: [
      "The group **contributes to an open-source project**, adding features and/or fixing bugs. The code you add must have a **back end** that connects to an external service — a database or an API.",
      "Start with **mob programming** to get everyone on the same page, then split into pairs and individual branches.",
    ],
    goals: [
      {
        icon: "mdi:source-pull",
        title: "Contribute to open source",
        text: "Find your way around an existing codebase and leave it better.",
      },
      {
        icon: "mdi:server-network",
        title: "Build a real back end",
        text: "Endpoints, CRUD and a database or external API behind them.",
      },
      {
        icon: "mdi:shield-lock-outline",
        title: "Keep it safe",
        text: "Authentication, and defences against common attacks.",
      },
      {
        icon: "mdi:book-open-variant",
        title: "Document it",
        text: "New API routes that the next developer can actually use.",
      },
    ],
  },

  requirements: [
    {
      label: "API",
      icon: "mdi:api",
      items: [
        "At least **3 endpoints** performing separate tasks — GET, POST, PUT and DELETE each count separately.",
        "**CRUD** operations.",
        "**Error handling** with correct response status codes (200, 404, …).",
        "The new API routes are **well documented**.",
      ],
    },
    {
      label: "Security",
      icon: "mdi:shield-lock-outline",
      items: [
        "An **API key or authentication** system to prevent unauthorised access.",
        "**Defence mechanisms** against common attacks — libraries are allowed.",
      ],
    },
    {
      label: "Freedom",
      icon: "mdi:toolbox-outline",
      items: [
        "Any programming language, framework and libraries.",
        "Any database and any hosting.",
      ],
    },
    {
      label: "Way of working",
      icon: "mdi:account-group-outline",
      items: [
        "Mob programming first, so everyone understands the codebase.",
        "Then pairs and individual branches.",
      ],
    },
  ],
  bonus: {
    title: "Nice to have",
    items: ["A front-end demo", "Access levels", "A caching layer", "Analytics", "Unit tests"],
  },
  handIn: [
    "A pull request to the chosen open-source project",
    "Documentation for every new API route",
    "Your presentation, on presentation day",
  ],

  ideas: [
    {
      icon: "mdi:school-outline",
      title: "io.vefskoli.is",
      text: "This site is open source: the home page, gallery, resources, people page, calendar page — or bug fixes.",
    },
    {
      icon: "mdi:github",
      title: "Any other open-source project",
      text: "A project you use, or one that needs the help.",
    },
  ],

  phases: [
    {
      title: "Explore together",
      icon: "mdi:account-group-outline",
      weight: 2,
      text: "Mob programming: learn the codebase and choose what to add.",
      tasks: ["Pick the project", "Run it locally", "Agree the scope", "Split the work"],
    },
    {
      title: "Build the API",
      icon: "mdi:server-network",
      weight: 5,
      text: "Pairs and branches: endpoints, data, errors and auth.",
      tasks: ["Endpoints and CRUD", "Error handling and status codes", "Authentication", "Defences against common attacks"],
    },
    {
      title: "Document & open the PR",
      icon: "mdi:source-pull",
      weight: 2,
      text: "Make it something the maintainers would merge.",
      tasks: ["Document every route", "Open the pull request", "Prepare the interactive demo", "Rehearse"],
    },
  ],

  presentation: [
    {
      title: "Introduction",
      minutes: 5,
      text: "The project, a demo, every endpoint working and the error handling.",
      criteria: ["product-overall"],
    },
    {
      title: "Programming",
      minutes: 15,
      text: "What you contributed, live coding, and the audience tests the API.",
      criteria: ["scope", "live-coding-quality", "live-coding-clarity", "interactive-demonstration"],
    },
    {
      title: "Q&A",
      minutes: 10,
      text: "Questions from the judges and the audience.",
      criteria: ["answering-questions", "presentation-overall"],
    },
  ],

  faq: [
    {
      question: "Are the dates final?",
      answer: "Not yet — spring 2027 dates are provisional until the spring calendar is confirmed. The timeline on this page follows them.",
    },
    {
      question: "What counts as an endpoint?",
      answer: "Each method on a route counts separately: GET, POST, PUT and DELETE are four. You need at least three, each doing a separate task.",
    },
    {
      question: "What do we hand in?",
      answer: "A pull request to the open-source project you chose.",
    },
    {
      question: "How is my own grade worked out?",
      answer: "From the team's result and how your teammates rate your contribution and teamwork. Try it in the grading section above.",
    },
  ],
};
