"use client";
import { useState } from "react";
import { InfoSubtitle, UserInfoCardWrapper } from "./style";
import { ShareableUserInfo } from "types/types";
import { UserInfoCard } from "components/userInfoCard/UserInfoCard";
import { ModuleOptions, Option } from "UIcomponents/dropdown/Dropdown";

export const UserInfoCards = ({
  userInfo,
  title,
  zIndex,
}: {
  userInfo: ShareableUserInfo[];
  title: string;
  zIndex?: number;
}) => {
  const [selectedUser, setSelectedUser] = useState<ShareableUserInfo | null>(
    null
  );

  const options: Option[] = userInfo?.length
    ? [{ optionName: "None", onClick: () => setSelectedUser(null) }].concat(
        userInfo.map((user: ShareableUserInfo) => {
          return {
            optionName: user.name,
            onClick: () => setSelectedUser(user),
          };
        })
      )
    : [];

  if (userInfo.length === 0) return <div>{`No ${title} found`}</div>;

  return (
    <UserInfoCardWrapper>
      <div
        style={{
          display: "flex",
          width: "100%",
          justifyContent: "space-between",
        }}
      >
        <InfoSubtitle>{title}</InfoSubtitle>
        <ModuleOptions
          options={options}
        />
      </div>
      {selectedUser && <UserInfoCard userInfo={selectedUser} />}
    </UserInfoCardWrapper>
  );
};
