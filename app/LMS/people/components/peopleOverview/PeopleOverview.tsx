import { UserInfoCards } from "../userInfoCards/UserInfoCards";
import { Container, Intro, PageTitle, Sections } from "./style";
import { TitleBlock } from "globalStyles/pageStyles";
import { ShareableUserInfo } from "types/types";

interface PeopleOverviewProps {
  teachers: ShareableUserInfo[];
  students: ShareableUserInfo[];
}

export const PeopleOverview = ({ teachers, students }: PeopleOverviewProps) => {
  return (
    <Container>
      <TitleBlock>
        <PageTitle>People</PageTitle>
        <Intro>Select someone to learn more about them</Intro>
      </TitleBlock>
      <Sections>
        <UserInfoCards userInfo={teachers} title="Teachers" />
        <UserInfoCards userInfo={students} title="Students" />
      </Sections>
    </Container>
  );
};
