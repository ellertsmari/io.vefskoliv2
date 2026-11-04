import type { ProjectBrief } from "constants/projectBrief";

export const connectingToTheWorld: ProjectBrief = {
  module: 4,
  slug: "connecting-to-the-world",
  title: "Connecting to the World",
  tagline:
    "A web application that gets its power from other systems' data, built with AI and owned line by line.",
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
        text: "Live data from at least two APIs and one MCP server, combined into something none of them could do alone.",
      },
      {
        icon: "mdi:account-search-outline",
        title: "Solve a real user's problem",
        text: "A design sprint finds the problem: interviews, analysis, brainstorming and testing with real users.",
      },
      {
        icon: "mdi:cellphone-check",
        title: "Mobile first, accessible",
        text: "Designed for the small screen first, and usable by everyone, with or without a mouse.",
      },
      {
        icon: "mdi:robot-outline",
        title: "Build with AI, own every line",
        text: "Use AI freely, check its work, and be able to explain every line you ship.",
      },
    ],
  },

  requirements: [
    {
      label: "Design sprint",
      icon: "mdi:run-fast",
      intro: "Based on the double diamond: diverge to understand, converge to decide.",
      items: [
        "Run it from **one schedule**: the team picks the best one from its members' Design Sprint guide returns.",
        "Pick a **facilitator** and a **decider**, and time-box every activity.",
        "Find a problem worth solving, and interview **real people** about it.",
        "Brainstorm and sketch alone, then share and vote together.",
        "Test the prototype with real users, and change it from what they tell you.",
        "Plan where the team uses AI and where it doesn't. AI may prepare questions and sort notes; it never invents interviews, answers or users.",
      ],
    },
    {
      label: "UI design",
      icon: "mdi:palette-outline",
      items: [
        "A **mobile-first** lo-fi prototype.",
        "A style guide with **smart components**: text, boolean, instance swap and variant properties, named the way the code names them.",
        "**Accessible** from the start: AA in Stark for contrast, type and touch targets.",
        "Annotations for the developers: alt text, focus order, headings and landmarks.",
        "A polished hi-fi prototype built only from component instances.",
      ],
    },
    {
      label: "Tech",
      icon: "mdi:code-tags",
      intro: "This is the longest group project so far. Choose your tools, and argue the choice with what you learned in Module 3.",
      items: [
        "A framework of your choice (React, Vue, Angular or something else), in **TypeScript**.",
        "Live data from **at least two APIs**, combined into something useful, with typed responses.",
        "**At least one MCP server**, with only the permissions it needs.",
        "Loading, empty and error states, and secret API keys that stay on the server.",
        "A component library: your team's design system in code, with props that match the Figma properties.",
        "A keyboard test and an axe scan that run in CI on every pull request.",
      ],
    },
    {
      label: "AI workflow",
      icon: "mdi:robot-outline",
      intro: "Use AI freely, in any part of the project. The golden rule: **if you can't explain a line, it doesn't belong in your project.**",
      items: [
        "**Day 1, the team harness:** one `AGENTS.md`, your design-system skill, the tests, and CI on every pull request.",
        "A human reviews every pull request, the agent's too.",
        "**A notes page every day.** A few bullets in your own words: what you asked, what the AI returned, what you changed and why, and what you learned.",
        "Then your agent adds its own account of the day: what it built (with commit hashes), where it was wrong and how that was caught. Save it as `report/notes/<date>-<your-name>.html` and commit it the same day.",
        "**Each student:** an interactive code explanation page about a complex part of the code they own.",
        "**The team:** an AI report at `report/index.html`, built from the notes: Try it, The problem, Decision log, What the AI got wrong, Code explanations, How we used AI.",
      ],
    },
    {
      label: "Product",
      icon: "mdi:rocket-launch-outline",
      items: [
        "The final product must be **available online** for the general public.",
        "It looks and behaves like your hi-fi prototype.",
        "The whole main flow works with the **keyboard only**, with focus always visible.",
      ],
    },
  ],
  bonus: {
    title: "Nice to have",
    items: [
      "Open the presentation with a 30–60 second launch film, made the way you made it in guide 4.4.",
      "An AI feature built into Chrome, as an extra rather than a replacement for the APIs.",
    ],
  },
  handIn: [
    "The live product, at a public URL",
    "The Git repository: `AGENTS.md`, the skill, the tests, CI and reviewed pull requests",
    "The Figma file: lo-fi prototype, style guide with components, and the annotated hi-fi prototype",
    "The AI report, linking every daily notes page and every student's code explanation page",
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
      text: "Start the design sprint, and give your agent its rules on day 1.",
      tasks: [
        "Pick one sprint schedule, a facilitator and a decider",
        "Set up the team harness: AGENTS.md, skill, tests, CI",
        "Write a problem statement and interview real people",
        "Pick the APIs and the MCP server that could help",
      ],
    },
    {
      title: "Design",
      icon: "mdi:draw",
      weight: 3,
      text: "Turn what you learned into a design, and test it before you code it.",
      tasks: [
        "Brainstorm and sketch",
        "Mobile-first lo-fi prototype, tested with users",
        "Style guide with smart components",
        "Annotated, accessible hi-fi prototype",
      ],
    },
    {
      title: "Build",
      icon: "mdi:code-tags",
      weight: 5,
      text: "One component and one reviewed pull request at a time.",
      tasks: [
        "Typed API calls, with loading and error states",
        "Components that match the Figma components",
        "A notes page every day",
        "Deploy early, deploy often",
      ],
    },
    {
      title: "Ship & rehearse",
      icon: "mdi:presentation-play",
      weight: 2,
      text: "Finish, polish, and practise the presentation.",
      tasks: [
        "Run the main flow with the keyboard only",
        "Fix what testers tripped over",
        "Finish the code explanation pages and the AI report",
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
      text: "From the sprint to the finished, accessible design.",
      criteria: [
        "design-sprint",
        "user-research",
        "discoveries",
        "user-testing",
        "mobile-first",
        "style-guide-smart-components",
        "accessible-design",
        "hifi-prototype",
      ],
    },
    {
      title: "Programming",
      minutes: 10,
      text: "The code live, the main flow with the keyboard only, and what you taught your agent, including one time it was wrong.",
      criteria: [
        "connecting-the-data",
        "loading-errors-keys",
        "component-library",
        "accessible-build",
        "team-harness",
        "code-explanation-page",
        "live-coding-quality",
        "live-coding-clarity",
        "gh-branches-commits-reviews",
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
      answer: "No. Use any APIs that help your users, but at least two of them, plus at least one MCP server. Which ones is up to you.",
    },
    {
      question: "Which framework do we use?",
      answer: "Your choice: React, Vue, Angular or something else. Argue the choice with what you learned in Module 3. TypeScript is required.",
    },
    {
      question: "Can we use AI?",
      answer: "Yes, any tool, in any part of the project, with one exception: interviews and user tests are with real people. AI may help you prepare questions and sort your notes, but it never invents answers or users. We grade how well you understand your work, not how much AI you used.",
    },
    {
      question: "What goes in the daily notes?",
      answer: "A few bullet points in your own words: what you asked, what the AI returned, what you changed and why, and what you learned. Then your agent turns the day into an HTML page with your notes word for word, followed by its own short, factual account. Don't commit raw chat transcripts: they can contain personal data or secret keys.",
    },
    {
      question: "What if I can't explain part of our code?",
      answer: "Then it isn't ready to merge. Ask the AI to explain it, walk a teammate through it, or rewrite it until you can. AI use you declared in your notes is never penalised; what counts is whether you understand the result.",
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
