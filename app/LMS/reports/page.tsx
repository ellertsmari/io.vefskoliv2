import { auth } from "../../../auth";
import { isActingAsTeacher } from "utils/userUtils";
import { redirect } from 'next/navigation';
import { Session } from "next-auth";
import { ReportsPage } from "./components/ReportsPage";
import { getUsersWithIds } from "serverActions/getUsersWithIds";
import { safeSerialize } from "utils/serialization";

const Reports = async () => {
  const session: Session | null = await auth();
  
  // Redirect if not authenticated or not a teacher
  if (!session?.user?.id || !isActingAsTeacher(session)) {
    redirect('/');
  }

  // Fetch students on server side and serialize properly
  const students = await getUsersWithIds({ role: "user" });
  const serializedStudents = safeSerialize(students);

  return <ReportsPage students={serializedStudents} />;
};

export default Reports;