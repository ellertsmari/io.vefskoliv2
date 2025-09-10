"use server";

import { auth } from "../../../auth";
import { redirect } from "next/navigation";
import { EditGuidesPage } from "../../components/editGuides/EditGuidesPage";
import { getGuides } from "../../serverActions/getGuides";
import { safeSerialize } from "../../utils/serialization";
import { Session } from "next-auth";

const EditGuides = async () => {
  const session: Session | null = await auth();
  
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  if (session.user.role !== "teacher") {
    redirect("/LMS/dashboard");
  }

  try {
    const fetchedGuides = (await getGuides(session.user.id)) || [];
    const serializedGuides = safeSerialize(fetchedGuides);

    return <EditGuidesPage guides={serializedGuides} />;
  } catch (error) {
    console.error("Error in edit guides page:", error);
    return (
      <div>
        <h1>Error</h1>
        <p>Something went wrong loading guides: {error instanceof Error ? error.message : 'Unknown error'}</p>
      </div>
    );
  }
};

export default EditGuides;