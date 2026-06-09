"use server";

import { auth } from "../../../../auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { EditGuideForm } from "../../../components/editGuides/EditGuideForm";
import { getGuideForTeacher } from "../../../serverActions/getGuide";
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

    return <EditGuideForm guide={guide} />;
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