import "globalStyles/globals.css";
import Countdown from "components/countdown/countdown";
import { BackgroundDiv } from "./style";
import Groups from "components/groups/groupsLayout";
import Links from "components/links/linksLayout";
import Notes from "components/notes/noteslayout";

const Landingpage = () => {
  return (
    <>
      <BackgroundDiv>
        <Countdown></Countdown>

        <Groups></Groups>

        <Links></Links>

        <Notes></Notes>
      </BackgroundDiv>
    </>
  );
};

export default Landingpage;
