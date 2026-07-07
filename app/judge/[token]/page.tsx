import type { Metadata } from "next";
import { getJudgeView } from "serverActions/groups/judgeActions";
import { JudgeViewPage } from "./JudgeViewPage";

export const metadata: Metadata = {
  title: "Judge | Vefskólinn LMS",
  description: "Evaluate the student team presentations.",
};

export const dynamic = "force-dynamic";

const NotFound = () => (
  <main style={{ padding: "4rem 2rem", textAlign: "center" }}>
    <h1>Invitation not found</h1>
    <p>
      This judging link is not valid (anymore). Please contact the teacher who
      invited you.
    </p>
  </main>
);

export default async function JudgePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const view = await getJudgeView(token);
  if (!view) return <NotFound />;
  return <JudgeViewPage view={view} token={token} />;
}
