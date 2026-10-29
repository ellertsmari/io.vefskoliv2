import { auth } from "../../auth";
import { Guides } from "./components/guides/Guides";
import {
  loadPublicGuideBoard,
  loadStudentGuideBoard,
} from "serverActions/guideBoard";
import { EmptyState, ErrorState } from "UIcomponents/states/States";
import { Session } from "next-auth";

const GuidesPage = async () => {
  const session: Session | null = await auth();
  
  if (session?.user?.id) {
    // Authenticated user - show personalized guides with status
    try {
      const { guides, modules } = await loadStudentGuideBoard();

      // An empty collection is a state, not an error.
      if (guides.length < 1) {
        return (
          <EmptyState
            title="No guides yet"
            message="Guides will show up here once your teachers publish them — check back soon."
          />
        );
      }

      return <Guides extendedGuides={guides} modules={modules} />;
    } catch (error) {
      console.error("Error in authenticated guides view:", error);
      return (
        <ErrorState message="We couldn't load your guides. Please refresh the page — and if it keeps happening, let a teacher know." />
      );
    }
  } else {
    // Public access - every guide, without user-specific statuses
    const board = await loadPublicGuideBoard();
    if (board === null) {
      return (
        <ErrorState message="We couldn't load the guides. Please refresh the page and try again." />
      );
    }
    if (board.guides.length < 1) {
      return (
        <EmptyState
          title="No guides yet"
          message="Guides will show up here once they're published — check back soon."
        />
      );
    }

    return <Guides extendedGuides={board.guides} modules={board.modules} />;
  }
};

export default GuidesPage;
