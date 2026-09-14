import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "../../../auth";
import { isActingAsTeacher } from "utils/userUtils";
import LiveClassroom from "./LiveClassroom";

export const metadata: Metadata = { title: "Reverse Flash · Vefskólinn" };
export const dynamic = "force-dynamic";

export default async function LivePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin?callbackUrl=/LMS/live");
  return <LiveClassroom name={session.user.name || "You"} isTeacher={isActingAsTeacher(session)} />;
}
