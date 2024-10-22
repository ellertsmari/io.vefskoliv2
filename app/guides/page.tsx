"use server";
import { getGuides } from "./query";

import { auth } from "../../auth";
import { Guides } from "./Guides";
import { Session } from "next-auth";
import { extendGuides, fetchModules } from "./utils";
import { Module } from "./types";

const GuidesPage = async () => {
  const session: Session | null = await auth();
  if (!session?.user?.id) return null;

  const fetchedGuides = (await getGuides(session.user.id)) || [];
  if (fetchedGuides.length < 1) throw new Error("No guides found");

  const extendedGuides = await extendGuides(
    JSON.parse(JSON.stringify(fetchedGuides))
  );

  if (extendedGuides.length < 1) throw new Error("No extended guides found");

  const modules: Module[] = await fetchModules(extendedGuides);

  return <Guides extendedGuides={extendedGuides} modules={modules} />;
};

export default GuidesPage;
