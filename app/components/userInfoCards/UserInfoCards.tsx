"use client";
import { useState } from "react";
import { InfoSubtitle, UserInfoCardWrapper } from "./style";
import { ShareableUserInfo } from "types/types";
import { UserInfoCard } from "components/userInfoCard/UserInfoCard";
import { Dropdown } from "UIcomponents/dropdown/Dropdown";

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

  const options =
    userInfo?.length &&
    [{ optionName: "None", onClick: () => setSelectedUser(null) }].concat(
      userInfo.map((user: ShareableUserInfo) => {
        return {
          optionName: user.name,
          onClick: () => setSelectedUser(user),
        };
      })
    );

  if (!userInfo?.length) return <div>{`No ${title} found`}</div>;

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
        <Dropdown
          options={options}
          titleOption={{
            optionName: title,
            onClick: () => setSelectedUser(null),
          }}
          zIndex={zIndex}
        />
      </div>
      {selectedUser && <UserInfoCard userInfo={selectedUser} />}
    </UserInfoCardWrapper>
  );
};
