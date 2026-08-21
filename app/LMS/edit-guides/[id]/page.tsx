import { auth } from "../../../../auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { EditGuideForm } from "../../../components/editGuides/EditGuideForm";
import { getGuideForTeacher } from "../../../serverActions/getGuide";
import { getExerciseAnalytics } from "../../../serverActions/getExerciseAnalytics";
import { ExerciseAnalyticsView } from "../../../components/editGuides/ExerciseAnalyticsView";
import { getShortAnswerReview } from "../../../serverActions/shortAnswerReview";
import { ShortAnswerReviewPanel } from "../../../components/editGuides/ShortAnswerReviewPanel";
import { safeSerialize } from "../../../utils/serialization";
import { Session } from "next-auth";

interface EditGuidePageProps {
  params: Promise<{ id: string }>;
}

const EditGuidePage = async ({ params }: EditGuidePageProps) => {
  const session: Session | null = await auth();
  
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  if (session.user.role !== "teacher") {
    redirect("/LMS/dashboard");
  }

  const { id } = await params;

  try {
    const guide = await getGuideForTeacher(id);
    
    if (!guide) {
      return (
        <div>
          <h1>Guide Not Found</h1>
          <p>The guide you&apos;re looking for doesn&apos;t exist.</p>
          <Link href="/LMS/edit-guides">← Back to Edit Guides</Link>
        </div>
      );
    }

    const isAutoGraded = guide.gradingMode === "auto" && guide.exercise;
    const [analytics, shortAnswerReviews] = isAutoGraded
      ? await Promise.all([
          getExerciseAnalytics(id),
          getShortAnswerReview(id),
        ])
      : [null, null];

    return (
      <>
        <EditGuideForm guide={guide} />
        {analytics && (
          <ExerciseAnalyticsView analytics={safeSerialize(analytics)} />
        )}
        {shortAnswerReviews && shortAnswerReviews.length > 0 && (
          <ShortAnswerReviewPanel
            guideId={id}
            reviews={safeSerialize(shortAnswerReviews)}
          />
        )}
      </>
    );
  } catch (error) {
    console.error("Error in edit guide page:", error);
    return (
      <div>
        <h1>Error</h1>
        <p>Something went wrong loading the guide: {error instanceof Error ? error.message : 'Unknown error'}</p>
        <Link href="/LMS/edit-guides">← Back to Edit Guides</Link>
      </div>
    );
  }
};

export default EditGuidePage;