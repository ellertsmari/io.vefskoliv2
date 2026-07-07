import type { Metadata } from "next";
import { getShowcase } from "serverActions/groups/getShowcase";
import { ShowcaseView } from "./ShowcaseView";

export const metadata: Metadata = {
  title: "Student Showcase | Vefskólinn",
  description:
    "Web applications designed and built by the students of Vefskólinn — from first websites to full-stack products.",
};

export const dynamic = "force-dynamic";

export default async function ShowcasePage() {
  const projects = await getShowcase();
  return <ShowcaseView projects={projects} />;
}
