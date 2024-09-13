import { getGuides } from "./query";
import { UserDocument } from "../models/user";

import { auth } from "../../auth";
import { Guides } from "./Guides";
import { GuideInfo, GuideWithLink } from "./types";

const GuidesPage = async () => {
  const session = (await auth()) as unknown as UserDocument;
  if (!session) return null;

  const fetchedGuides: GuideInfo[] = (await getGuides(session)) || [];

  return <Guides fetchedGuides={JSON.parse(JSON.stringify(fetchedGuides))} />;
};

export default GuidesPage;
