import { redirect } from "next/navigation";
import { auth } from "../../../auth";
import { PeopleOverview } from "./components/peopleOverview/PeopleOverview";
import { getUsers } from "serverActions/getUsers";
import { getPendingUsers } from "serverActions/approveUsers";
import { hasTeacherPermissions } from "utils/userUtils";

const PeoplePage = async () => {
  // The proxy already redirects anonymous visitors; checking here as well
  // means the page holds even if a future Next release changes what the
  // proxy matcher covers.
  const session = await auth();
  if (!session?.user) redirect("/signin");

  const [teachers, students, pending] = await Promise.all([
    getUsers({ role: "teacher" }),
    getUsers({ role: "user" }),
    // Only teachers see who is waiting to be let in.
    hasTeacherPermissions(session) ? getPendingUsers() : Promise.resolve([]),
  ]);

  return (
    <PeopleOverview teachers={teachers} students={students} pending={pending} />
  );
};

export default PeoplePage;
