import "globalStyles/globals.css";
import Countdown from "components/countdown/countdown";
import {
  BackgroundDiv,
  MainContainer,
  NewSidebarContainer,
  RightSideMain,
} from "./style";
import Groups from "components/groups/groupsLayout";
import Links from "components/links/linksLayout";
import Notes from "components/notes/noteslayout";
import CalendarComponent from "components/calendar/calendar";

const Landingpage = () => {
  return (
    <>
      <BackgroundDiv>
        <MainContainer>
          <NewSidebarContainer>
            <Countdown></Countdown>
            <Notes></Notes>
          </NewSidebarContainer>
          <RightSideMain>
            <Links></Links>

            <Groups></Groups>

            <CalendarComponent></CalendarComponent>
          </RightSideMain>
        </MainContainer>
      </BackgroundDiv>
    </>
  );
};

export default Landingpage;
