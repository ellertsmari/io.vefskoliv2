import type { ProjectBrief } from "constants/projectBrief";

export const connectingToTheWorld: ProjectBrief = {
  module: 4,
  slug: "connecting-to-the-world",
  title: "Connecting to the World",
  tagline:
    "A React and TypeScript application that gets its power from other systems, through their APIs.",
  teamSize: "4–5 students",
  updated: "2026-11-04",
  theme: {
    heroBackground: "#0b1530",
    heroText: "#eaf2ff",
    background: "#f3f6fb",
    surface: "#ffffff",
    text: "#0f1a2e",
    muted: "#52607a",
    accent: "#0b7a76",
    accentText: "#ffffff",
    headingFont: "Space Grotesk",
    bodyFont: "Manrope",
  },

  mission: {
    statement:
      "Almost every web application you use talks to dozens of other systems. In this project, yours does too.",
    paragraphs: [
      "The ability to exchange data with other services is one of the most important aspects of web applications. Your online bank is made up of dozens of internal systems. The Icelandic government offers services that run in completely different systems. When you search for your destination on Google Maps you are using several systems at once — and even io.vefskoli.is is made up of two.",
      "The mechanism that lets these systems talk to one another is the **API** (Application Programming Interface): an abstract term for a way one system can use the resources or functionality of another.",
      "Connecting APIs is one thing. Figuring out which connections would actually benefit your users is an art in itself, so it is crucial to understand the needs and expectations of the people who will use your application.",
    ],
    aside: {
      title: "Why this matters more in the age of AI",
      text: "Making websites is getting easier, and many say supply and demand will make web developers unemployed. History says otherwise. When steam engines needed less coal, people expected coal miners to suffer — but cheap coal made people want more of it. That is **Jevons paradox**, and it has held for LED lights, fuel-efficient cars and, as we know best in Iceland, cheap hot water: we build huge swimming pools and take longer showers. The same is predicted for web development, so let's prepare for an age of large-scale websites where everyone has their own custom CMS and can pull any relevant data from anywhere, on demand.",
    },
    goals: [
      {
        icon: "mdi:api",
        title: "Talk to other systems",
        text: "Your product connects to external APIs, with typed responses, to do more than it could on its own.",
      },
      {
        icon: "mdi:account-search-outline",
        title: "Solve a real user's problem",
        text: "A design sprint finds the problem: interviews, analysis, brainstorming and testing with users.",
      },
      {
        icon: "mdi:cellphone-check",
        title: "Mobile first, accessible",
        text: "Designed for the small screen first, and usable by everyone.",
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
      label: "Design sprint",
      icon: "mdi:run-fast",
      intro: "Based on the double diamond: diverge to understand, converge to decide.",
      items: [
        "Find a problem worth solving.",
        "Interview potential users and analyse what you learn.",
        "Brainstorm solutions, test them, and finalise from user feedback.",
      ],
    },
    {
      label: "UI design",
      icon: "mdi:palette-outline",
      items: [
        "A **mobile-first** lo-fi prototype.",
        "A well-connected style guide: colours, typography, components.",
        "A fully polished hi-fi prototype built on the style guide.",
        "**Accessibility** throughout — contrast, keyboard, screen readers.",
      ],
    },
    {
      label: "Tech",
      icon: "mdi:react",
      intro: "This is the longest group project so far. React helps you split the code so everyone can work on their own piece.",
      items: [
        "**React** and **TypeScript**.",
        "A styling library: styled-components or Tailwind.",
        "Other JavaScript libraries are encouraged.",
        "**Use of APIs is mandatory.**",
      ],
    },
    {
      label: "Product",
      icon: "mdi:rocket-launch-outline",
      items: [
        "The final product must be **available online** for the general public.",
        "It should look and behave like your hi-fi prototype.",
      ],
    },
  ],
  handIn: [
    "The live product, at a public URL",
    "The Git repository — branches, daily commits and reviewed pull requests",
    "The Figma file: lo-fi prototype, style guide and hi-fi prototype",
    "Your presentation, on presentation day",
  ],

  ideas: [
    {
      icon: "mdi:message-reply-text-outline",
      title: "Better feedback on io.vefskoli.is",
      text: "Make the feedback students give and get on their work more useful.",
    },
    {
      icon: "mdi:trophy-outline",
      title: "A Hall of Fame",
      text: "Celebrate the best work from Vefskólinn students, past and present.",
    },
    {
      icon: "mdi:database-search-outline",
      title: "Under-used public APIs",
      text: "Find open data nobody is making good use of, and build what it deserves.",
    },
    {
      icon: "mdi:earth-plus",
      title: "The UN Sustainable Development Goals",
      text: "Pick one of the 17 goals and build something that moves it forward.",
    },
  ],

  phases: [
    {
      title: "Discover",
      icon: "mdi:magnify",
      weight: 2,
      text: "Start the design sprint: find a problem and the people who have it.",
      tasks: [
        "Agree on how the team works: backlog, status meetings, Git flow",
        "Write a problem statement",
        "Interview potential users",
        "Pick the APIs that could help",
      ],
    },
    {
      title: "Design",
      icon: "mdi:draw",
      weight: 3,
      text: "Turn what you learned into a design, and test it before you code it.",
      tasks: [
        "Brainstorm and sketch",
        "Mobile-first lo-fi prototype",
        "Test it with users and change it",
        "Style guide and hi-fi prototype",
      ],
    },
    {
      title: "Build",
      icon: "mdi:code-tags",
      weight: 5,
      text: "React and TypeScript, one component and one pull request at a time.",
      tasks: [
        "Typed API calls, with loading and error states",
        "Components that match the style guide",
        "Code review on every pull request",
        "Deploy early, deploy often",
      ],
    },
    {
      title: "Ship & rehearse",
      icon: "mdi:presentation-play",
      weight: 2,
      text: "Finish, polish, check accessibility, and practise the presentation.",
      tasks: [
        "Accessibility check",
        "Fix what testers tripped over",
        "Pick and rehearse the live-coding piece",
        "QR code so the audience can try it",
      ],
    },
  ],

  presentation: [
    {
      title: "Introduction",
      minutes: 5,
      text: "Let the audience try it, show the product, and explain how you worked.",
      criteria: ["trying-it-out", "product-demo", "work-organization", "task-to-feature", "tools-tech-stack"],
    },
    {
      title: "Design",
      minutes: 7,
      text: "From the sprint to the finished design.",
      criteria: [
        "ux-design-sprint-tools",
        "user-research",
        "discoveries",
        "user-testing",
        "mobile-first",
        "accessibility",
        "style-guide",
        "hifi-prototype",
      ],
    },
    {
      title: "Programming",
      minutes: 10,
      text: "The code, live, and how you kept it in order together.",
      criteria: [
        "typescript-api",
        "naming-convention",
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
  presentationNote: "After the presentations everyone joins a common retro meeting.",

  faq: [
    {
      question: "Do we have to use a particular API?",
      answer: "No — any API that helps your users. Using APIs is mandatory; which ones is up to you.",
    },
    {
      question: "Can we use other libraries than React?",
      answer: "Yes. React, TypeScript and a styling library are required; other JavaScript libraries are encouraged.",
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
