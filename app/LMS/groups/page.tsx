import type { Metadata } from "next";
import { auth } from "../../../auth";
import { getGroupProjects } from "serverActions/groups/getGroupProjects";
import { GroupsListView } from "./GroupsListView";

export const metadata: Metadata = {
  title: "Group Projects | Vefskólinn LMS",
  description: "Group projects, team formation and team hubs.",
};

const GroupsPage = async () => {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }

  const projects = await getGroupProjects();

  return (
    <GroupsListView
      projects={projects}
      isTeacher={session.user.role === "teacher"}
    />
  );
};

export default GroupsPage;
