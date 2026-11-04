import type { ProjectBrief } from "constants/projectBrief";

export const growingComplexity: ProjectBrief = {
  module: 6,
  slug: "growing-complexity",
  title: "Growing Complexity",
  tagline: "A real product for real users: accounts, data, design and deployment — the whole thing.",
  teamSize: "4 students",
  updated: "2026-11-04",
  theme: {
    heroBackground: "#0f2a22",
    heroText: "#f3ecd8",
    background: "#f6f1e6",
    surface: "#fffdf8",
    text: "#1b1a16",
    muted: "#5d584b",
    accent: "#8a5d0c",
    accentText: "#ffffff",
    headingFont: "Fraunces",
    bodyFont: "Source Sans 3",
  },

  mission: {
    statement: "The last group project. Build something people could start using tomorrow.",
    paragraphs: [
      "Each group creates a **complex web application**, ready to be used in the real world by real users.",
      "The technology is your choice. What is fixed is the complexity: your product must include at least **9 of the 10 complexity aspects** below, and they shape the final grade.",
    ],
    goals: [
      {
        icon: "mdi:account-key-outline",
        title: "Real users, real accounts",
        text: "Anyone can sign up and use it — authentication, data that persists, administration.",
      },
      {
        icon: "mdi:layers-triple-outline",
        title: "Complexity, on purpose",
        text: "At least nine complexity aspects, chosen and built well.",
      },
      {
        icon: "mdi:account-heart-outline",
        title: "Designed with users",
        text: "Design Thinking for the flow, tested with real people.",
      },
      {
        icon: "mdi:earth",
        title: "Live for everyone",
        text: "Online for the general public to create an account and use.",
      },
    ],
  },

  requirements: [
    {
      label: "Way of working",
      icon: "mdi:account-group-outline",
      items: ["Agile methods: backlog, status meetings, pair programming."],
    },
    {
      label: "Design",
      icon: "mdi:palette-outline",
      items: [
        "A lo-fi prototype, a style guide and a hi-fi prototype.",
        "Design Thinking for the application flow.",
      ],
    },
    {
      label: "Tech",
      icon: "mdi:toolbox-outline",
      items: [
        "**Free choice of technology.**",
        "The complexity aspects are the only guideline.",
      ],
    },
    {
      label: "Product",
      icon: "mdi:rocket-launch-outline",
      items: ["Online for the **general public to create an account and use**."],
    },
  ],
  pickList: {
    title: "Complexity aspects",
    intro: "Your product must include at least 9 of these. Tick the ones you plan to build.",
    minimum: 9,
    items: [
      "Agile methodologies",
      "Design Thinking (UX)",
      "User testing (UX)",
      "Complete UI design",
      "Authentication / user accounts",
      "User administration / data persistence (database or headless CMS)",
      "Static generation or SSR",
      "State management",
      "Deployment (public link)",
      "API connections",
    ],
  },
  bonus: {
    title: "Even better",
    items: [
      "Automated tests",
      "File uploading",
      "Security measures",
      "Multiplatform access",
      "Sharing capabilities",
      "SEO",
      "GDPR-awareness",
      "AI integration",
      "Your own technical challenge, after consulting the instructors",
    ],
  },
  handIn: [
    "The live product, where anyone can create an account",
    "The Git repository",
    "Lo-fi prototype, style guide and hi-fi prototype",
    "Your presentation, on presentation day",
  ],

  ideas: [
    { icon: "mdi:school-outline", title: "A better io LMS", text: "You know its rough edges better than anyone." },
    { icon: "mdi:shopping-outline", title: "A “Shopify” for creatives", text: "Selling handmade work without the overhead." },
    { icon: "mdi:web", title: "A website builder for artists", text: "A portfolio that is theirs, without writing code." },
    { icon: "mdi:truck-delivery-outline", title: "A delivery platform", text: "Orders, routes and people waiting at the door." },
    { icon: "mdi:briefcase-search-outline", title: "A job listing site", text: "Matching people and work, both ways." },
    { icon: "mdi:meditation", title: "A mindfulness platform", text: "Something calm, built with care." },
  ],

  phases: [
    {
      title: "Discover & plan",
      icon: "mdi:compass-outline",
      weight: 1.5,
      text: "Who it is for, what it does, and which complexity aspects you take on.",
      tasks: ["User research", "Pick the complexity aspects", "Backlog", "Architecture and tech choices"],
    },
    {
      title: "Design",
      icon: "mdi:draw",
      weight: 2,
      text: "Design Thinking for the flow, then the design proper.",
      tasks: ["Moodboard and sketches", "Lo-fi prototype and user tests", "Style guide", "Hi-fi prototype"],
    },
    {
      title: "Build",
      icon: "mdi:code-tags",
      weight: 4,
      text: "Accounts, data, state and APIs — in sprints, in pairs.",
      tasks: ["Authentication", "Data persistence", "State management", "Deploy continuously"],
    },
    {
      title: "Test with users",
      icon: "mdi:account-check-outline",
      weight: 1,
      text: "Real people, real accounts, real feedback.",
      tasks: ["User tests on the live product", "Fix what they found", "Harden it"],
    },
    {
      title: "Present twice",
      icon: "mdi:presentation-play",
      weight: 0.5,
      text: "First to teachers for feedback, then fine-tuned for the industry panel.",
      tasks: ["Teacher run-through", "Act on the feedback", "Final presentation"],
    },
  ],

  presentation: [
    {
      title: "Introduction",
      minutes: 10,
      text: "The group and the project, and the audience tests the site.",
      criteria: ["product-interactive-demo"],
    },
    {
      title: "Design",
      minutes: 10,
      text: "Moodboard, sketches, wireframes and style guide; the UI prototype; your UX approach and user tests.",
      criteria: ["groundwork", "final-ui-design", "ux-design-thinking"],
    },
    {
      title: "Programming",
      minutes: 10,
      text: "The technology, and code written live.",
      criteria: ["technology-stack", "live-coding-quality", "live-coding-clarity"],
    },
    {
      title: "Q&A",
      minutes: 10,
      text: "Questions from the judges and the audience.",
      criteria: ["answering-questions", "presentation-overall"],
    },
  ],
  presentationNote:
    "You present twice: first to the teachers for feedback and grades, then — fine-tuned — to industry professionals.",

  faq: [
    {
      question: "Are the dates final?",
      answer: "Not yet — spring 2027 dates are provisional until the spring calendar is confirmed. The timeline on this page follows them.",
    },
    {
      question: "Which technology do we have to use?",
      answer: "Any. The complexity aspects are the only guideline.",
    },
    {
      question: "Do we really need nine complexity aspects?",
      answer: "Yes — at least 9 of the 10. They modulate the final grade.",
    },
    {
      question: "How is my own grade worked out?",
      answer: "From your team's result and how your teammates rate your contribution and teamwork. Try it in the grading section above.",
    },
  ],
};
