"use server";

import { auth } from "../../auth";
import { Guides } from "components/guides/Guides";
import { Module, ReturnStatus, FeedbackStatus, GradesReceivedStatus, GradesGivenStatus } from "types/guideTypes";
import { getGuides } from "serverActions/getGuides";
import { getPublicGuides } from "serverActions/getPublicGuides";
import { extendGuides, fetchModules } from "utils/guideUtils";
import { createPublicGuideInfo, fetchPublicModules } from "utils/publicGuideUtils";
import { safeSerialize } from "utils/serialization";
import { Session } from "next-auth";

const GuidesPage = async () => {
  const session: Session | null = await auth();
  
  if (session?.user?.id) {
    // Authenticated user - show personalized guides with status
    try {
      const fetchedGuides = (await getGuides(session.user.id)) || [];
      if (fetchedGuides.length < 1) throw new Error("No guides found");

      const extendedGuides = await extendGuides(fetchedGuides);

      if (extendedGuides.length < 1) throw new Error("No extended guides found");

      const modules: Module[] = await fetchModules(extendedGuides);

      // Serialize the data before passing to client component
      const serializedGuides = safeSerialize(extendedGuides);
      const serializedModules = safeSerialize(modules);

      return <Guides extendedGuides={serializedGuides} modules={serializedModules} />;
    } catch (error) {
      console.error("Error in authenticated guides view:", error);
      return (
        <div>
          <h1>Error</h1>
          <p>Something went wrong: {error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
      );
    }
  } else {
    // Public access - fetch guides without user-specific data
    try {
      const publicGuides = await getPublicGuides();
      if (!publicGuides || publicGuides.length < 1) throw new Error("No guides found");

      // Convert to the format expected by the Guides component
      const publicGuideInfos = publicGuides.map(createPublicGuideInfo);
      
      // Add the link property and status properties with default values for public access
      const guidesWithLinks = publicGuideInfos.map(guide => ({
        ...guide,
        link: `/guides/${guide._id}`,
        // Add status properties with default values (no status needed for public view)
        returnStatus: ReturnStatus.NOT_RETURNED,
        feedbackStatus: FeedbackStatus.AWAITING_PROJECTS,
        gradesReceivedStatus: GradesReceivedStatus.AWAITING_GRADES,
        grade: undefined,
        gradesGivenStatus: GradesGivenStatus.AWAITING_FEEDBACK,
      }));

      const modules: Module[] = await fetchPublicModules(publicGuides);

      // Serialize the data before passing to client component to prevent circular reference issues
      const serializedGuides = safeSerialize(guidesWithLinks);
      const serializedModules = safeSerialize(modules);

      return <Guides extendedGuides={serializedGuides} modules={serializedModules} />;
    } catch (error) {
      console.error("Error in public guides view:", error);
      return (
        <div>
          <h1>Error</h1>
          <p>Something went wrong: {error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
      );
    }
  }
};

export default GuidesPage;





