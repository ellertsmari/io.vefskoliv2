"use client";
import { useState } from "react";
import { OptionalUserInfo, UserDocument } from "../../models/user";
import { Dropdown } from "components/dropdown/Dropdown";
import { InfoSubtitle, InfoWrapper, UserInfoCardWrapper } from "./style";
import { SubTitle } from "globalStyles/text";
import React from "react";

export const UserInfoCards = ({
  users,
  title,
  zIndex,
}: {
  users: UserDocument[];
  title: string;
  zIndex?: number;
}) => {
  if (!users?.length) return <div>{`No ${title} found`}</div>;

  const [selectedUser, setSelectedUser] = useState<UserDocument | null>(null);

  const options = [
    { optionName: "None", onClick: () => setSelectedUser(null) },
  ].concat(
    users.map((user: UserDocument) => {
      return {
        optionName: user.name,
        onClick: () => setSelectedUser(user),
      };
    })
  );

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
      {selectedUser && <Info user={selectedUser} />}
    </UserInfoCardWrapper>
  );
};

const Info = ({ user }: { user: UserDocument }) => {
  const userInfo: (keyof OptionalUserInfo)[] = [
    "background",
    "careerGoals",
    "interests",
    "favoriteArtists",
  ];

  const info = userInfo.filter((detail) => user[detail]);

  const toRender = info.map((detail, index) => {
    return (
      <React.Fragment key={index}>
        <SubTitle>{detail.toUpperCase()}</SubTitle>
        <p>{user[detail]}</p>
      </React.Fragment>
    );
  });

  return (
    <InfoWrapper>
      {toRender.length > 0 ? toRender : <p>No information found</p>}
    </InfoWrapper>
  );
};
