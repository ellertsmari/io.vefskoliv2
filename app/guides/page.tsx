import { getGuides } from "./query";

import { auth } from "../../auth";
import { Guides } from "./Guides";
import { GuideInfo } from "./types";
import { Session } from "next-auth";

const GuidesPage = async () => {
  const session: Session | null = await auth();
  if (!session?.user?.id) return null;

  const fetchedGuides: GuideInfo[] = (await getGuides(session.user.id)) || [];

  return <Guides fetchedGuides={JSON.parse(JSON.stringify(fetchedGuides))} />;
};

export default GuidesPage;
