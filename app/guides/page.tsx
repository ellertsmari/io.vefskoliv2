import { GuideInfo, GuideInfoWithLink, getGuides } from "./query";
import { UserDocument, UserWithIdType } from "../models/user";

import { auth } from "../../auth";
import { Guides } from "./Guides";

const GuidesPage = async () => {
  const session = (await auth()) as unknown as UserDocument;
  if (!session) return null;

  const fetchingGuides: GuideInfo[] = (await getGuides(session)) || [];
  const link: GuideInfoWithLink[] = fetchingGuides.map((guide) => ({
    ...guide,
    individualGuideLink: `guides/${guide._id}`,
  }));

  return <Guides fetchedGuides={JSON.parse(JSON.stringify(link))} />;
};

export default GuidesPage;
