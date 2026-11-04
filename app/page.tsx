import type { Metadata } from "next";
import { auth } from "auth";
import { redirect } from "next/navigation";
import LandingPageContent from "./landingPage/LandingPageContent";
import { getGalleryItems } from "./serverActions/getGallery";
import {
  PROGRAMME_NAME,
  PROGRAMME_NAME_EN,
  SCHOOL_NAME,
  SITE_NAME,
  SITE_URL,
} from "constants/site";
import {
  ADDRESS,
  APPLY_URL,
  PROGRAMME_PAGE_URL,
  QUESTION_FORM_URL,
  SOCIAL_LINKS,
  TUITION_PER_TERM_ISK,
  faq,
  modules,
  summary,
} from "./landingPage/aboutVefskolinn";

// Bing Webmaster Tools flagged the old title ("Vefskólinn · Vefþróun ·
// Tækniskólinn", 36 characters) as too short to say what the page is.
const TITLE = `${SITE_NAME} · AI-native Web Development in Iceland · ${SCHOOL_NAME}`;
const DESCRIPTION = `${SITE_NAME} (${PROGRAMME_NAME}) at ${SCHOOL_NAME}: one year of web development and design, taught in English, with AI built in. ${TUITION_PER_TERM_ISK.toLocaleString("en-US")} kr per term. Hafnarfjörður, Iceland.`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/",
    type: "website",
    siteName: SITE_NAME,
    locale: "en_IS",
  },
};

const ORGANIZATION_ID = `${SITE_URL}/#organization`;

const postalAddress = {
  "@type": "PostalAddress",
  streetAddress: ADDRESS.street,
  postalCode: ADDRESS.postalCode,
  addressLocality: ADDRESS.locality,
  addressCountry: ADDRESS.country,
};

/**
 * What the landing page says, as schema.org data for search engines and AI
 * assistants: the school, the programme and the FAQ. Built from the same
 * text the page shows (landingPage/aboutVefskolinn.ts).
 */
const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "EducationalOrganization",
      "@id": ORGANIZATION_ID,
      name: SITE_NAME,
      alternateName: [PROGRAMME_NAME, PROGRAMME_NAME_EN],
      url: SITE_URL,
      description: summary,
      address: postalAddress,
      parentOrganization: {
        "@type": "EducationalOrganization",
        name: SCHOOL_NAME,
        url: "https://tskoli.is/",
      },
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "admissions",
        url: QUESTION_FORM_URL,
        availableLanguage: ["en", "is"],
      },
      sameAs: Object.values(SOCIAL_LINKS),
    },
    {
      "@type": "Course",
      name: `${PROGRAMME_NAME}: Web Development and Design`,
      description: summary,
      url: SITE_URL,
      sameAs: PROGRAMME_PAGE_URL,
      provider: { "@id": ORGANIZATION_ID },
      inLanguage: "en",
      numberOfCredits: 90,
      educationalCredentialAwarded: `Diploma from ${SCHOOL_NAME}, 90 einingar at hæfniþrep 4`,
      timeRequired: "P1Y",
      offers: {
        "@type": "Offer",
        category: "Paid",
        price: TUITION_PER_TERM_ISK * 3,
        priceCurrency: "ISK",
        description: `${TUITION_PER_TERM_ISK.toLocaleString("en-US")} kr per term, three terms.`,
        url: APPLY_URL,
      },
      hasCourseInstance: {
        "@type": "CourseInstance",
        courseMode: "Blended",
        inLanguage: "en",
        location: { "@type": "Place", name: SCHOOL_NAME, address: postalAddress },
      },
      syllabusSections: modules.map(({ name, description }) => ({
        "@type": "Syllabus",
        name,
        description,
      })),
    },
    {
      "@type": "FAQPage",
      mainEntity: faq.map(({ question, answer }) => ({
        "@type": "Question",
        name: question,
        acceptedAnswer: { "@type": "Answer", text: answer },
      })),
    },
  ],
};

const HomePage = async () => {
  const session = await auth();

  // If user is logged in, redirect to dashboard
  if (session?.user) {
    redirect("/LMS/dashboard");
  }

  // If not logged in, show the regular homepage content
  const galleryItems = await getGalleryItems();

  return (
    <>
      <script
        type="application/ld+json"
        // Escaping "<" keeps any text from closing the script tag early.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <LandingPageContent galleryItems={galleryItems} />
    </>
  );
}

export default HomePage;
