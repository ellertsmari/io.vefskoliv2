import type { ProjectBrief } from "constants/projectBrief";

export const firstWebsite: ProjectBrief = {
  module: 1,
  slug: "first-website",
  title: "First Website",
  tagline: "Testing the water: design it in Figma, build it in HTML and CSS, and put it online — as a team.",
  teamSize: "",
  updated: "2026-11-04",
  theme: {
    heroBackground: "#1d1a3a",
    heroText: "#fff4e6",
    background: "#fff8ef",
    surface: "#ffffff",
    text: "#1d1a3a",
    muted: "#5f5a78",
    accent: "#c8341f",
    accentText: "#ffffff",
    headingFont: "Bricolage Grotesque",
    bodyFont: "DM Sans",
  },

  mission: {
    statement: "Your first website, made the way professionals make them: together, designed first, and published for real.",
    paragraphs: [
      "The group creates a website prototype with **Figma, HTML and CSS** — JavaScript is optional — and publishes it online. The suggested platform is **GitHub Pages**.",
      "The theme can be fictitious or real. Use your imagination and your network to find an idea worth building.",
    ],
    goals: [
      {
        icon: "mdi:account-group-outline",
        title: "Work as a team",
        text: "An MVP, a backlog, a sprint plan and status meetings — and Git to hold it together.",
      },
      {
        icon: "mdi:palette-swatch-outline",
        title: "Design before you build",
        text: "Moodboard, sketches and a UI design in Figma.",
      },
      {
        icon: "mdi:language-html5",
        title: "Clean, semantic code",
        text: "Semantic HTML, clean CSS, comments, and a layout that works on every screen.",
      },
      {
        icon: "mdi:web",
        title: "Publish it",
        text: "A static site, live on GitHub Pages.",
      },
    ],
  },

  requirements: [
    {
      label: "Project management",
      icon: "mdi:clipboard-text-outline",
      items: [
        "Team building and a product definition (MVP).",
        "A backlog and sprint planning.",
        "Status meetings and pair programming.",
        "Git for everything.",
      ],
    },
    {
      label: "Design",
      icon: "mdi:palette-outline",
      items: [
        "A moodboard.",
        "Sketches, and a wireframe if you like.",
        "A UI design in **Figma**.",
      ],
    },
    {
      label: "Code",
      icon: "mdi:code-tags",
      items: [
        "Semantic HTML.",
        "Clean code with comments.",
        "Responsive: it works on phones as well as laptops.",
        "JavaScript is optional.",
      ],
    },
    {
      label: "Deployment",
      icon: "mdi:cloud-upload-outline",
      items: ["A static site on **GitHub Pages**."],
    },
  ],
  handIn: [
    "The live site on GitHub Pages",
    "The Git repository",
    "The Figma design",
    "Your presentation, on presentation day",
  ],

  ideas: [
    {
      icon: "mdi:party-popper",
      title: "A town festival",
      text: "Everything a visitor needs: what, where, when — and why come.",
    },
    {
      icon: "mdi:brush-variant",
      title: "An artist's portfolio",
      text: "Let the work speak, and make it easy to get in touch.",
    },
    {
      icon: "mdi:storefront-outline",
      title: "A company page, redesigned",
      text: "Find a local business whose website lets it down, and do better.",
    },
    {
      icon: "mdi:heart-outline",
      title: "A shared interest",
      text: "Something the whole group cares about.",
    },
  ],

  phases: [
    {
      title: "Team & idea",
      icon: "mdi:lightbulb-on-outline",
      weight: 1,
      text: "Get to know each other, pick the idea and agree on the MVP.",
      tasks: ["Choose the idea", "Define the MVP", "Write the backlog", "Set up the Git repository"],
    },
    {
      title: "Design",
      icon: "mdi:draw",
      weight: 1.5,
      text: "Moodboard, sketches and the UI in Figma.",
      tasks: ["Moodboard", "Sketches", "Colour palette and typography", "UI design in Figma"],
    },
    {
      title: "Build",
      icon: "mdi:code-tags",
      weight: 2,
      text: "HTML and CSS, in pairs, with Git.",
      tasks: ["Semantic HTML", "CSS from the design", "Responsive layout", "Daily status meeting"],
    },
    {
      title: "Publish & rehearse",
      icon: "mdi:presentation-play",
      weight: 0.5,
      text: "Put it online and practise the presentation.",
      tasks: ["Deploy to GitHub Pages", "Pick the live-coding piece", "Rehearse"],
    },
  ],

  presentation: [
    {
      title: "Introduction",
      minutes: 5,
      text: "The group, the project and a demo of the product.",
      criteria: ["product-overall"],
    },
    {
      title: "Design",
      minutes: 5,
      text: "How the design came together.",
      criteria: ["color-typography", "hierarchy-alignment", "ui-design"],
    },
    {
      title: "Programming",
      minutes: 5,
      text: "Your tech stack, and a piece of the code written live.",
      criteria: ["tech-stack", "live-coding-quality", "live-coding-clarity"],
    },
    {
      title: "Q&A",
      minutes: 5,
      text: "Questions from the judges and the audience.",
      criteria: ["answering-questions", "presentation-overall"],
    },
  ],

  faq: [
    {
      question: "Do we need JavaScript?",
      answer: "No. Figma, HTML and CSS are the requirement; JavaScript is optional.",
    },
    {
      question: "Does the theme have to be real?",
      answer: "No — it can be fictitious or real. Use your imagination and your network.",
    },
    {
      question: "Where do we publish it?",
      answer: "GitHub Pages is the suggested platform: free, and it deploys straight from your repository.",
    },
    {
      question: "How is my own grade worked out?",
      answer: "From your team's result and how your teammates rate your contribution and teamwork. Try it in the grading section above.",
    },
  ],
};
