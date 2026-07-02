import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "../../../../auth";
import { getGroupProject } from "serverActions/groups/getGroupProject";
import { getEvaluationReports } from "serverActions/groups/getEvaluationReports";
import { ProjectView } from "./ProjectView";

export const metadata: Metadata = {
  title: "Group Project | Vefskólinn LMS",
};

const GroupProjectPage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { id } = await params;
  const details = await getGroupProject(id);
  if (!details) notFound();

  const isTeacher = session.user.role === "teacher";
  const reports = isTeacher ? await getEvaluationReports(id) : null;

  return (
    <ProjectView
      details={details}
      reports={reports}
      isTeacher={isTeacher}
      userId={session.user.id}
    />
  );
};

export default GroupProjectPage;
