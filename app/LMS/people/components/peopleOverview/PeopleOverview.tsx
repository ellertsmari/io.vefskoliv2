import { UserInfoCards } from "../userInfoCards/UserInfoCards";
import { PendingApprovals } from "../pendingApprovals/PendingApprovals";
import { Container, Intro, PageTitle, Sections } from "./style";
import { TitleBlock } from "globalStyles/pageStyles";
import { ShareableUserInfo } from "types/types";
import type { PendingUser } from "serverActions/approveUsers";

interface PeopleOverviewProps {
  teachers: ShareableUserInfo[];
  students: ShareableUserInfo[];
  /** Registrations awaiting approval — teachers only; empty for everyone else. */
  pending?: PendingUser[];
}

export const PeopleOverview = ({
  teachers,
  students,
  pending = [],
}: PeopleOverviewProps) => {
  return (
    <Container>
      <TitleBlock>
        <PageTitle>People</PageTitle>
        <Intro>Select someone to learn more about them</Intro>
      </TitleBlock>
      <Sections>
        {pending.length > 0 && <PendingApprovals pending={pending} />}
        <UserInfoCards userInfo={teachers} title="Teachers" />
        <UserInfoCards userInfo={students} title="Students" />
      </Sections>
    </Container>
  );
};
