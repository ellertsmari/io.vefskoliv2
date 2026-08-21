import { OptionalUserInfoKeys } from "models/user";
import React from "react";
import {
  CardHeader,
  DetailLabel,
  DetailValue,
  InfoWrapper,
  PersonHeading,
  DetailGrid,
  NoInfo,
} from "./style";
import { ShareableUserInfo } from "types/types";
import { Avatar } from "UIcomponents/avatar/Avatar";

interface UserInfoCardProps {
  userInfo: ShareableUserInfo;
}

/** Human labels; `name` and `avatarUrl` are rendered by the header instead. */
const DETAIL_LABELS: Partial<Record<OptionalUserInfoKeys, string>> = {
  [OptionalUserInfoKeys.background]: "Background",
  [OptionalUserInfoKeys.careerGoals]: "Near future career goals",
  [OptionalUserInfoKeys.interests]: "Main interests",
  [OptionalUserInfoKeys.favoriteArtists]: "Favorite band/artist",
};

export const UserInfoCard = ({ userInfo }: UserInfoCardProps) => {
  const details = (
    Object.keys(DETAIL_LABELS) as OptionalUserInfoKeys[]
  ).flatMap((key) => {
    const value = userInfo[key];
    return value ? [{ key, label: DETAIL_LABELS[key]!, value }] : [];
  });

  return (
    <InfoWrapper>
      <CardHeader>
        <Avatar name={userInfo.name} url={userInfo.avatarUrl} size={72} />
        <PersonHeading>{userInfo.name}</PersonHeading>
      </CardHeader>

      {details.length > 0 ? (
        <DetailGrid>
          {details.map(({ key, label, value }) => (
            <React.Fragment key={key}>
              <DetailLabel>{label}</DetailLabel>
              <DetailValue>{value}</DetailValue>
            </React.Fragment>
          ))}
        </DetailGrid>
      ) : (
        <NoInfo>{`${userInfo.name} hasn't filled in their profile yet.`}</NoInfo>
      )}
    </InfoWrapper>
  );
};
