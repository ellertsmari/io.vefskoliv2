import { getGuides } from "./query";
import { UserWithIdType } from "../models/user";

import GuidesClient from "./guidesClient";
import { GuideType } from "../models/guide";
import { auth } from "../../auth";

const Guides = async () => {
  const session = (await auth()) as unknown as UserWithIdType;
  if (!session) return null;

  const fetchingGuides = (await getGuides(session)) || [];
  const link = fetchingGuides.map((guide: GuideType) => ({
    ...guide,
    individualGuideLink: `guides/${(guide as any)._id}`,
  }));

  return <GuidesClient fetchedGuides={JSON.parse(JSON.stringify(link))} />;
};

export default Guides;
