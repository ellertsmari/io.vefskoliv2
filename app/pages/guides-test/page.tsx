"use server";
import Guides from "../../components/guidesWidget/guidesLayout";
import { getGuides } from "serverActions/getGuides";
import { extendGuides, fetchModules } from "utils/guideUtils";
import { Module } from "types/guideTypes";

const HallOfFame = async () => {
  const userId = "67b48a1159ab390636d322d9";

  const fetchedGuides = (await getGuides(userId)) || [];
  if (fetchedGuides.length < 1) throw new Error("No guides found");
  const extendedGuides = await extendGuides(
    JSON.parse(JSON.stringify(fetchedGuides))
  );
  const modules: Module[] = await fetchModules(extendedGuides);
  console.log(extendedGuides);

  return (
    <div>
      <h1>Vefskólinn</h1>
      <Guides data={extendedGuides}>

      </Guides>
    </div>
  );
};

export default HallOfFame;
