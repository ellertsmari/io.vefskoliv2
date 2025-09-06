"use server";

import { auth } from "../auth";
import { StudentHomePage } from "./components/studentHome/StudentHomePage";
import { TeacherHomePage } from "./components/teacherHome/TeacherHomePage";
import { Module } from "types/guideTypes";
import { getGuides } from "serverActions/getGuides";
import { extendGuides, fetchModules } from "utils/guideUtils";
import { safeSerialize } from "utils/serialization";
import { Session } from "next-auth";
import { redirect } from 'next/navigation';

const HomePage = async () => {
  const session: Session | null = await auth();
  
  if (!session?.user?.id) {
    // Redirect unauthenticated users to login
    redirect('/login');
  }

  // Authenticated user - show personalized home page based on role
  try {
    const fetchedGuides = (await getGuides(session.user.id)) || [];
    if (fetchedGuides.length < 1) throw new Error("No guides found");

    const extendedGuides = await extendGuides(fetchedGuides);

    if (extendedGuides.length < 1) throw new Error("No extended guides found");

    const modules: Module[] = await fetchModules(extendedGuides);

    // Serialize the data before passing to client component
    const serializedGuides = safeSerialize(extendedGuides);
    const serializedModules = safeSerialize(modules);

    // Check user role and return appropriate home page
    if (session.user.role === "teacher") {
      return <TeacherHomePage extendedGuides={serializedGuides} modules={serializedModules} />;
    } else {
      return <StudentHomePage extendedGuides={serializedGuides} modules={serializedModules} />;
    }
  } catch (error) {
    console.error("Error in home page:", error);
    return (
      <div>
        <h1>Error</h1>
        <p>Something went wrong: {error instanceof Error ? error.message : 'Unknown error'}</p>
      </div>
    );
  }
};

export default HomePage;