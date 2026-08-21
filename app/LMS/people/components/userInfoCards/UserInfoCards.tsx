"use client";
import {
  InfoSubtitle,
  PeopleGrid,
  PersonCard,
  PersonCount,
  PersonName,
  SectionHeader,
  UserInfoCardWrapper,
  EmptyState,
} from "./style";
import { ShareableUserInfo } from "types/types";
import { UserInfoCard } from "../userInfoCard/UserInfoCard";
import { Avatar } from "UIcomponents/avatar/Avatar";
import Modal from "UIcomponents/modal/modal";

export const UserInfoCards = ({
  userInfo,
  title,
}: {
  userInfo: ShareableUserInfo[];
  title: string;
}) => {
  if (userInfo.length === 0) {
    return (
      <UserInfoCardWrapper>
        <InfoSubtitle>{title}</InfoSubtitle>
        <EmptyState>{`No ${title.toLowerCase()} found`}</EmptyState>
      </UserInfoCardWrapper>
    );
  }

  return (
    <UserInfoCardWrapper>
      <SectionHeader>
        <InfoSubtitle>{title}</InfoSubtitle>
        <PersonCount>{userInfo.length}</PersonCount>
      </SectionHeader>

      <PeopleGrid>
        {userInfo.map((user, index) => (
          // Names are the only identifier the shareable projection returns, so
          // the index guards against two people sharing one.
          <li key={`${user.name}-${index}`}>
            <Modal
              modalTrigger={
                <PersonCard type="button">
                  <Avatar name={user.name} url={user.avatarUrl} size={72} />
                  <PersonName>{user.name}</PersonName>
                </PersonCard>
              }
              modalContent={<UserInfoCard userInfo={user} />}
            />
          </li>
        ))}
      </PeopleGrid>
    </UserInfoCardWrapper>
  );
};
