import { getGuides } from "./query";
import { UserDocument } from "../models/user";

import { auth } from "../../auth";
import { Guides } from "./Guides";
import { GuideInfo, GuideInfoWithLink } from "./types";

const GuidesPage = async () => {
  const session = (await auth()) as unknown as UserDocument;
  if (!session) return null;

  const fetchingGuides: GuideInfo[] = (await getGuides(session)) || [];
  const link: GuideInfoWithLink[] = fetchingGuides.map((guide) => ({
    ...guide,
    link: `guides/${guide._id}`,
  }));

  return <Guides fetchedGuides={JSON.parse(JSON.stringify(link))} />;
};

export default GuidesPage;
