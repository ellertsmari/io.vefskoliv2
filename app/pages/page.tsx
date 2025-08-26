"use server";

import { auth } from "../../auth";
import { StudentHomePage } from "components/studentHome/StudentHomePage";
import { Session } from "next-auth";
import { extendGuides, fetchModules } from "utils/guideUtils";
import { Module } from "types/guideTypes";
import { getGuides } from "serverActions/getGuides";

const HomePage = async () => {
  const session: Session | null = await auth();
  if (!session?.user?.id) return null;

  const fetchedGuides = (await getGuides(session.user.id)) || [];
  if (fetchedGuides.length < 1) throw new Error("No guides found");

  const extendedGuides = await extendGuides(
    JSON.parse(JSON.stringify(fetchedGuides))
  );

  if (extendedGuides.length < 1) throw new Error("No extended guides found");

  const modules: Module[] = await fetchModules(extendedGuides);

  return <StudentHomePage extendedGuides={extendedGuides} modules={modules} />;
};

export default HomePage;
