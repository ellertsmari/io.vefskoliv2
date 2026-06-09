"use server";

import { auth } from "../../../auth";
import { StudentHomePage } from "../../components/studentHome/StudentHomePage";
import { TeacherHomePage } from "../../components/teacherHome/TeacherHomePage";
import { Module } from "../../../types/guideTypes";
import { getGuides } from "../../serverActions/getGuides";
import { extendGuides, fetchModules } from "../../utils/guideUtils";
import { safeSerialize } from "../../utils/serialization";
import { EmptyState, ErrorState } from "UIcomponents/states/States";
import { Session } from "next-auth";
import { redirect } from 'next/navigation';

const Dashboard = async () => {
  const session: Session | null = await auth();
  
  
  // Let middleware handle authentication, but still check for safety
  if (!session?.user?.id) {
    return (
      <div>
        <h1>Authentication Required</h1>
        <p>Please sign in to access the dashboard.</p>
      </div>
    );
  }

  // Authenticated user - show personalized home page based on role
  try {
    const fetchedGuides = (await getGuides(session.user.id)) || [];
    const extendedGuides = await extendGuides(fetchedGuides);

    if (extendedGuides.length < 1) {
      return (
        <EmptyState
          title="Welcome!"
          message="Your dashboard will fill up once guides are published — check back soon."
        />
      );
    }

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
      <ErrorState message="We couldn't load your dashboard. Please refresh the page — and if it keeps happening, let a teacher know." />
    );
  }
};

export default Dashboard;