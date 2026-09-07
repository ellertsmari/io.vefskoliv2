import { auth } from "../../../auth";
import { redirect } from "next/navigation";
import { EditGuidesPage } from "../../components/editGuides/EditGuidesPage";
import { getGuidesForEditor } from "../../serverActions/editGuideActions";
import { hasTeacherPermissions } from "../../utils/userUtils";
import { ErrorState } from "UIcomponents/states/States";
import { Session } from "next-auth";

export const dynamic = "force-dynamic";

const EditGuides = async () => {
  const session: Session | null = await auth();

  if (!session?.user?.id) {
    redirect("/signin?callbackUrl=/LMS/edit-guides");
  }
  if (!hasTeacherPermissions(session)) {
    redirect("/LMS/dashboard");
  }

  try {
    const guides = await getGuidesForEditor();
    return <EditGuidesPage guides={guides} />;
  } catch (error) {
    console.error("Error in edit guides page:", error);
    return (
      <ErrorState message="We couldn't load the guides. Please refresh the page and try again." />
    );
  }
};

export default EditGuides;
