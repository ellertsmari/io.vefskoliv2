import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { getBriefBySlug } from "serverActions/groups/getPublicBriefs";
import { BriefView } from "../components/BriefView";
import { briefExcerpt } from "../components/briefExcerpt";
import { SCHOOL_NAME, SITE_NAME, SITE_URL } from "constants/site";

type Params = Promise<{ slug: string }>;

export const dynamic = "force-dynamic";

const loadBrief = cache(async (slug: string) => getBriefBySlug(slug));

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const project = await loadBrief(slug);
  if (!project) return { title: `Project not found · ${SITE_NAME}` };

  const title = `${project.title} · Group project brief · ${SITE_NAME}`;
  const description = briefExcerpt(project) || undefined;
  const url = `/projects/${slug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: project.title,
      description,
      url,
      type: "article",
      siteName: SITE_NAME,
      ...(project.brief.coverImage ? { images: [project.brief.coverImage] } : {}),
    },
    // A teacher's preview of an unpublished brief must never be indexed.
    ...(project.isPreview ? { robots: { index: false, follow: false } } : {}),
  };
}

export default async function ProjectBriefPage({ params }: { params: Params }) {
  const { slug } = await params;
  const project = await loadBrief(slug);
  if (!project) notFound();

  const url = `${SITE_URL}/projects/${slug}`;
  // What the brief is, for search engines and AI assistants: a learning
  // resource from the school, with its dates, criteria and team size.
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    "@id": `${url}#brief`,
    name: project.title,
    headline: project.brief.tagline || project.title,
    description: briefExcerpt(project),
    url,
    inLanguage: "en",
    learningResourceType: "Project brief",
    educationalLevel: "Post-secondary vocational",
    teaches: project.rubric.map((item) => item.title),
    ...(project.brief.coverImage ? { image: project.brief.coverImage } : {}),
    ...(project.brief.updatedAt ? { dateModified: project.brief.updatedAt } : {}),
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

  return (
    <>
      {!project.isPreview && (
        <script
          type="application/ld+json"
          // Escaping "<" keeps any text from closing the script tag early.
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
          }}
        />
      )}
      <BriefView
        project={project}
        previewBanner={
          project.isPreview
            ? project.status === "formation"
              ? "Teacher preview — this page goes public once teams are formed and the brief is published."
              : "Teacher preview — not published yet. Publish it from the project's Brief tab."
            : null
        }
      />
    </>
  );
}
