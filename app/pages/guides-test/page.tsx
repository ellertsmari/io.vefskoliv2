"use server";
import Guides from "../../components/guides/guidesLayout";
import { getGuides } from "serverActions/getGuides";
import { extendGuides } from "utils/guideUtils";

const GuidesWidget = async ()=> {
  const userId ='67b48a1159ab390636d322d9'

  const fetchedGuides =(await getGuides(userId)) || [];
  if(fetchedGuides.length<1) throw new Error("No guides found")
  const extendedGuides = await extendGuides(
    JSON.parse(JSON.stringify(fetchedGuides))
  );
  return (
    <div>
      <Guides data={extendedGuides}></Guides>
    </div>
  );
};

export default GuidesWidget;
