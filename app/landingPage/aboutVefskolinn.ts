/**
 * Everything the landing page says about the programme, in one place. The
 * page renders it and app/page.tsx turns the same text into structured data
 * (JSON-LD), so what people read and what search engines and AI assistants
 * are told cannot drift apart.
 *
 * Application dates are deliberately not here: tskoli.is is the single source
 * of truth for them, and a copy here would go stale. Link to it instead.
 *
 * Facts checked 4 November 2026 against tskoli.is/namsbraut/vefthroun and,
 * for the VR grant, starfsmennt.is (Starfsmenntasjóður verslunar- og
 * skrifstofufólks: 90% of tuition, at most 180,000 kr a year; credit-bearing
 * study at framhaldsskóli level counts).
 */

/** Tækniskólinn's application form for the programme. */
export const APPLY_URL = "https://umsokn.inna.is/#!/login/id/1102/23560";

/** The programme page at Tækniskólinn: application dates live here. */
export const PROGRAMME_PAGE_URL = "https://tskoli.is/namsbraut/vefthroun/";

/**
 * The question form on the programme page. It goes to the programme's contact
 * person, who forwards study questions to the teachers.
 */
export const QUESTION_FORM_URL = `${PROGRAMME_PAGE_URL}#faq-1`;

export const ADDRESS = {
  street: "Flatahraun 12",
  postalCode: "220",
  locality: "Hafnarfjörður",
  country: "IS",
};

export const SOCIAL_LINKS = {
  instagram: "https://www.instagram.com/vefskolinn/",
  facebook: "https://www.facebook.com/vefskolinn/",
  linkedin: "https://www.linkedin.com/company/vefskolinn/",
};

export const TUITION_PER_TERM_ISK = 30000;

/** One line that says what the school is; reused in metadata and JSON-LD. */
export const summary =
  "Vefskólinn is a one-year, AI-native web development and design programme at Tækniskólinn in Hafnarfjörður, Iceland, taught in English.";

export const aboutUs = [
  "Vefskólinn is the web development programme at Tækniskólinn. Its official name is Vefþróun, in English the Reykjavik Academy of Web Development. In one year you learn to design, build and ship web products: the interface people use and the code behind it. It is the only programme in Iceland that teaches web design, user interfaces and web programming together.",
  "Every student does both design and code. A developer without an eye for the interface cannot organise the data well, and a designer who cannot build cannot ship. That combined profile is the one small teams hire first, so we do not offer a design-only or code-only track.",
  "We are small on purpose: one cohort a year, a programming teacher and a design teacher, and a classroom where everyone knows your name.",
];

export const facts: { label: string; value: string }[] = [
  { label: "Length", value: "1 year full time (autumn, spring and summer term), or up to 2 years at your own pace" },
  { label: "Credits", value: "90 einingar at hæfniþrep 4, a diploma from Tækniskólinn" },
  { label: "Language", value: "All teaching in English" },
  { label: "Tuition", value: "30,000 kr per term, 90,000 kr for the whole programme" },
  { label: "Where", value: "Tækniskólinn, Flatahraun 12, Hafnarfjörður" },
  { label: "Intake", value: "Once a year, in autumn" },
];

export const theProgram =
  "The programme is project-based. Most modules end in a group project that you present in public, and guests from Icelandic tech companies grade it together with the teachers. The tools open up as the year goes on: by the later modules you choose your own stack. The final project is done in the summer term together with a company or another partner, under a teacher's guidance.";

export const modules: { name: string; description: string }[] = [
  { name: "Introduction", description: "HTML, CSS, design basics and how we work." },
  { name: "Community and networking", description: "Industry visits, meetups and your first professional contacts." },
  { name: "The fundamentals", description: "TypeScript, the design process and user interface design." },
  { name: "Connecting to the world", description: "React, APIs and accessibility." },
  { name: "Back end and infrastructure", description: "Databases, authentication, deployment and open source, including two weeks at our Erasmus+ partner school in Las Palmas in January." },
  { name: "Growing complexity", description: "Testing, larger applications and choosing your own stack." },
  { name: "Exploration", description: "Specialities and your own direction, ending in the final project." },
];

export const howWeUseAI = {
  intro:
    "Typing code was never the hard part of the job. Deciding what to build, judging what comes back and shipping something people can use is. Those skills matter more, not less, when an AI assistant does the typing, so the programme is built around them.",
  phases: [
    {
      name: "Phase one: foundations",
      description:
        "Hands on the keyboard, no assistants. HTML, CSS, TypeScript and the design process, until you know what code does before anything writes it for you.",
    },
    {
      name: "Phase two: AI on every project",
      description:
        "You use AI assistants the way working developers do, and we grade what you verified: tests, code review, security, and whether you can explain every line you shipped.",
    },
  ],
  rule: "The rule is simple: you own every line you ship.",
};

export const howStudyingWorks = [
  "The teachers are in the classroom every working day from 9 to 16. Attendance is not compulsory and there is no penalty for missing a day: we expect you to take responsibility for your own studies.",
  "We do strongly recommend coming in. The classroom is where the help is, every day, and where you get to know your classmates. A good class spirit makes the year better for everyone.",
  "Deadlines are as flexible as we can make them. If you have the time and the ambition, you can finish in one year. Life happens, though: people get sick, have children or land their dream job halfway through. You can take up to two years to finish.",
];

export const graduateEmployers = [
  "Hugsmiðjan",
  "Jökulá",
  "Kolibri",
  "Reon",
  "Metall",
  "Origo",
  "Icelandair",
  "Taktical",
];

export const graduates = `Graduates work as web developers and interface designers at agencies and in-house teams, at companies such as ${graduateEmployers.slice(0, -1).join(", ")} and ${graduateEmployers.at(-1)}. Many also work freelance or start their own companies.`;

/**
 * Answers people ask before they apply, in the words they would ask them.
 * Shown on the page and published as FAQPage structured data.
 */
export const faq: { question: string; answer: string }[] = [
  {
    question: "How long is the programme?",
    answer:
      "Three terms (autumn, spring and summer), 90 einingar. Full time, that is one year. You can also take up to two years at your own pace.",
  },
  {
    question: "How much does it cost?",
    answer:
      "30,000 kr per term, 90,000 kr for the whole programme. The programme qualifies for student loans from Menntasjóður námsmanna. VR and LÍV members can apply to Starfsmenntasjóður verslunar- og skrifstofufólks for up to 90% of tuition, at most 180,000 kr a year, and other unions' education funds are worth checking too.",
  },
  {
    question: "Is it taught in English?",
    answer: "Yes. All teaching is in English, and you need good English to apply. You do not need to speak Icelandic.",
  },
  {
    question: "Do I have to attend every day?",
    answer:
      "No. The teachers are in the classroom every working day from 9 to 16, and we strongly recommend coming in, but attendance is not compulsory and missing a day has no penalty. You take responsibility for your own studies.",
  },
  {
    question: "How is AI used in the programme?",
    answer:
      "In two phases. First you learn the foundations by hand, without AI assistants. Then AI is part of every project, and you are graded on how you verified the result: tests, code review, security and explaining every line you shipped.",
  },
  {
    question: "Do I need to know how to code before I start?",
    answer:
      "No. You need a stúdentspróf or equivalent education, basic computer skills and good English. A background in graphic design or some programming strengthens your application, and relevant work experience is considered.",
  },
  {
    question: "When and how do I apply?",
    answer:
      "Students are admitted once a year, for the autumn term. Application dates are published on the programme page at tskoli.is, and you apply through Tækniskólinn's application form. After the deadline, applicants are invited to an admission project that works the way the programme does.",
  },
  {
    question: "What do I need to bring?",
    answer: "Your own laptop.",
  },
  {
    question: "Who can I ask about the programme?",
    answer:
      "Send your question through the form on the programme page at tskoli.is. It reaches the programme's contact person, who passes questions about the studies on to the teachers.",
  },
];
