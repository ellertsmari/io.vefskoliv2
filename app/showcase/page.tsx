import type { Metadata } from "next";
import { getShowcase } from "serverActions/groups/getShowcase";
import { ShowcaseView } from "./ShowcaseView";

export const metadata: Metadata = {
  title: "Student Showcase | Vefskólinn",
  description:
    "Web applications designed and built by the students of Vefskólinn — from first websites to full-stack products.",
};

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ year?: string }> };

export default async function ShowcasePage({ searchParams }: Props) {
  const { year } = await searchParams;
  const parsed = Number(year);
  const index = await getShowcase(Number.isInteger(parsed) ? parsed : undefined);
  return <ShowcaseView index={index} />;
}
