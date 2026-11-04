import type { Metadata } from "next";
import { getPublicBriefs } from "serverActions/groups/getPublicBriefs";
import { ProjectsIndex } from "./components/ProjectsIndex";
import { SCHOOL_NAME, SITE_NAME } from "constants/site";

export const metadata: Metadata = {
  title: `Group Project Briefs: Real Web Products, Built in Teams · ${SITE_NAME} · ${SCHOOL_NAME}`,
  description: `The group projects of the ${SITE_NAME} web development programme at ${SCHOOL_NAME}: what each team builds, the requirements, how it is presented and how it is graded.`,
  alternates: { canonical: "/projects" },
};

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const projects = await getPublicBriefs();
  return <ProjectsIndex projects={projects} />;
}
