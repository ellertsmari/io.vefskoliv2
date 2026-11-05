import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { getBriefBySlug } from "serverActions/groups/getPublicBriefs";
import { BriefView } from "../components/BriefView";
import { plainText } from "../components/Rich";
import { SCHOOL_NAME, SITE_NAME, SITE_URL } from "constants/site";

type Params = Promise<{ slug: string }>;

export const dynamic = "force-dynamic";

const loadBrief = cache(async (slug: string) => getBriefBySlug(slug));

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const project = await loadBrief(slug);
  if (!project) return { title: `Project not found · ${SITE_NAME}` };

  const { brief } = project;
  const title = `${brief.title} · Group project brief · ${SITE_NAME}`;
  const description = brief.tagline;
  const url = `/projects/${slug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: brief.title,
      description,
      url,
      type: "article",
      siteName: SITE_NAME,
      ...(brief.coverImage ? { images: [brief.coverImage] } : {}),
    },
    // A teacher's preview of an unpublished brief must never be indexed.
    ...(project.isPreview ? { robots: { index: false, follow: false } } : {}),
  };
}

export default async function ProjectBriefPage({ params }: { params: Params }) {
  const { slug } = await params;
  const project = await loadBrief(slug);
  if (!project) notFound();

  const { brief } = project;
  const url = `${SITE_URL}/projects/${slug}`;
  // What the brief is, for search engines and AI assistants: a learning
  // resource from the school, with its dates, criteria and team size.
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    "@id": `${url}#brief`,
    name: brief.title,
    headline: brief.tagline,
    description: [brief.tagline, plainText(brief.mission.statement)].join(" "),
    url,
    inLanguage: "en",
    learningResourceType: "Project brief",
    educationalLevel: "Post-secondary vocational",
    teaches: project.rubric.map((item) => item.title),
    ...(brief.coverImage ? { image: brief.coverImage } : {}),
    dateModified: brief.updated,
    temporalCoverage: `${project.startDate.slice(0, 10)}/${project.endDate.slice(0, 10)}`,
    isPartOf: {
      "@type": "Course",
      name: project.module ? `Module ${project.module}` : "Web development",
      provider: {
        "@type": "EducationalOrganization",
        "@id": `${SITE_URL}/#organization`,
        name: SITE_NAME,
        parentOrganization: { "@type": "EducationalOrganization", name: SCHOOL_NAME },
        url: SITE_URL,
      },
    },
  };

  // The questions students ask, as an FAQ search engines and assistants
  // can quote directly.
  const faqData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${url}#faq`,
    mainEntity: brief.faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: plainText(item.answer) },
    })),
  };

  return (
    <>
      {!project.isPreview &&
        [structuredData, faqData].map((data) => (
          <script
            key={data["@id"]}
            type="application/ld+json"
            // Escaping "<" keeps any text from closing the script tag early.
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(data).replace(/</g, "\\u003c"),
            }}
          />
        ))}
      <BriefView
        project={project}
        previewBanner={
          project.isPreview
            ? "Teacher preview — this page goes public once teams are formed, or when you make it public in the project's Settings."
            : null
        }
      />
    </>
  );
}
