import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getShowcaseTeam } from "serverActions/groups/getShowcase";
import { ShowcaseTeamView } from "./ShowcaseTeamView";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ teamId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { teamId } = await params;
  const detail = await getShowcaseTeam(teamId);
  if (!detail) return { title: "Project | Vefskólinn Showcase" };
  return {
    title: `${detail.team.projectName} | Vefskólinn Showcase`,
    description:
      detail.team.tagline ||
      detail.team.projectDescription.slice(0, 160) ||
      `A project built by ${detail.team.name} at Vefskólinn.`,
  };
}

export default async function ShowcaseTeamPage({ params }: Props) {
  const { teamId } = await params;
  const detail = await getShowcaseTeam(teamId);
  if (!detail) notFound();
  return <ShowcaseTeamView detail={detail} />;
}
