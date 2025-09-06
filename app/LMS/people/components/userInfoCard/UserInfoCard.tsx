import { SubHeading1 } from "globalStyles/text";
import { OptionalUserInfoKeys } from "models/user";
import React from "react";
import { InfoWrapper } from "./style";
import { ShareableUserInfo } from "types/types";

interface UserInfoCardProps {
  userInfo: ShareableUserInfo;
}

export const UserInfoCard = ({ userInfo }: UserInfoCardProps) => {
  const info = Object.keys(userInfo) as OptionalUserInfoKeys[];
  const toRender = info.map((detail) => {
    return (
      <React.Fragment key={detail}>
        <SubHeading1>{detail.toUpperCase()}</SubHeading1>
        <p>{userInfo[detail]}</p>
      </React.Fragment>
    );
  });

  return (
    <InfoWrapper>
      {toRender.length > 0 ? toRender : <p>No information found</p>}
    </InfoWrapper>
  );
};
