import { auth } from "../../../auth";
import { StudentHomePage } from "../../components/studentHome/StudentHomePage";
import { TeacherHomePage } from "../../components/teacherHome/TeacherHomePage";
import { loadStudentGuideBoard } from "../../serverActions/guideBoard";
import { getGroupProjects } from "../../serverActions/groups/getGroupProjects";
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

  // The teacher dashboard is a set of shortcuts and a grading queue — it reads
  // none of the guide data, so don't pay to fetch, extend and serialize it.
  if (session.user.role === "teacher") {
    return <TeacherHomePage />;
  }

  // Authenticated user - show personalized home page based on role
  try {
    const [{ guides, modules }, groupProjects] = await Promise.all([
      loadStudentGuideBoard(),
      getGroupProjects(),
    ]);

    if (guides.length < 1) {
      return (
        <EmptyState
          title="Welcome!"
          message="Your dashboard will fill up once guides are published — check back soon."
        />
      );
    }

    return (
      <StudentHomePage
        extendedGuides={guides}
        modules={modules}
        groupProjects={groupProjects}
      />
    );
  } catch (error) {
    console.error("Error in home page:", error);
    return (
      <ErrorState message="We couldn't load your dashboard. Please refresh the page — and if it keeps happening, let a teacher know." />
    );
  }
};

export default Dashboard;