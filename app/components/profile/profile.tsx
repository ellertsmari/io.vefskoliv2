"use client";
import {
  ProfileImage,
  ProfileImageContainer,
  ProfileName,
  ProfileWrapper,
  LogoutButton,
  Form,
  ProfileDetails,
  AdditionalInfo,
  ButtonWrapper,
  ProfileInfo,
  Logout,
  Wrapper,
} from "./style";
import { useState } from "react";
import Modal from "../../UIcomponents/modal/modal";
import Input from "../../globalStyles/input";
import DefaultButton from "../../globalStyles/buttons/default";
import { DefaultUserIcon } from "assets/Icons";
import { UserType } from "models/user";
import { useSession } from "providers/SessionProvider";
import { LogoutIcon } from "assets/Icons";
import { signOut } from "serverActions/signOut";
import { updateUserInfo } from "serverActions/updateUserInfo";
import { useSessionState } from "react-session-hooks";

export const Profile = () => {
  //getting the user from session
  const session = useSession();
  //fix unknown later
  const user = session?.user as UserType;

  const ProfilePictureContainer = () => {
    return (
      <ProfileWrapper>
        <ProfilePicture url={user.avatarUrl} />

        <ProfileName>{user.name}</ProfileName>
      </ProfileWrapper>
    );
  };

  return (
    <Wrapper>
      {user ? (
        <Modal
          modalTrigger={<ProfilePictureContainer />}
          modalContent={<EditProfileScreen user={user} />}
        />
      ) : (
        <div>loading...</div>
      )}
    </Wrapper>
  );
};

const EditProfileScreen = ({ user }: { user: UserType }) => {
  const [userInfo, setUserInfo, loading] = useSessionState("userInfo", {
    background: user?.background || "",
    careerGoals: user?.careerGoals || "",
    interests: user?.interests || "",
    favoriteArtists: user?.favoriteArtists || "",
  });

  if (loading || !userInfo) {
    return <div>loading...</div>;
  }

  const onSave = async () => {
    await updateUserInfo(userInfo);
  };

  const { background, careerGoals, interests, favoriteArtists } = userInfo;

  return (
    <>
      <ProfileDetails>
        <ProfilePicture url={user.avatarUrl} />
        <ProfileInfo>
          <ProfileName style={{ fontSize: "16px" }}>{user.name}</ProfileName>
          <AdditionalInfo>{user.role}</AdditionalInfo>
          <AdditionalInfo
            style={{ color: "var(--primary-black-100)", textTransform: "none" }}
          >
            {user.email}
          </AdditionalInfo>
        </ProfileInfo>
        <Logout>
          <LogoutButton
            onClick={async () => await signOut()}
            aria-label="logout button"
          >
            <p style={{ fontSize: "12px" }}>LOGOUT</p>
            <LogoutIcon />
          </LogoutButton>
        </Logout>
      </ProfileDetails>
      <Form>
        <Input
          type="text"
          id="background"
          value={background}
          onChange={(e: { target: { value: string } }) => {
            setUserInfo({ ...userInfo, background: e.target.value });
          }}
          label="BACKGROUND"
        />
        <Input
          type="text"
          id="careerGoals"
          value={careerGoals}
          onChange={(e: { target: { value: string } }) => {
            setUserInfo({ ...userInfo, careerGoals: e.target.value });
          }}
          label="NEAR FUTURE CAREER GOALS"
        />
        <Input
          type="text"
          id="interests"
          placeholder={user.interests}
          value={interests}
          onChange={(e: { target: { value: string } }) =>
            setUserInfo({ ...userInfo, interests: e.target.value })
          }
          label="MAIN INTERESTS"
        />
        <Input
          type="text"
          id="favoriteArtists"
          value={favoriteArtists}
          onChange={(e: { target: { value: string } }) =>
            setUserInfo({ ...userInfo, favoriteArtists: e.target.value })
          }
          label="FAVORITE BAND/ARTIST"
        />
      </Form>
      <ButtonWrapper>
        <DefaultButton style="default" onClick={onSave}>
          SAVE
        </DefaultButton>
        <DefaultButton style="outlined">CHANGE PASSWORD</DefaultButton>
      </ButtonWrapper>
    </>
  );
};

const ProfilePicture = ({ url }: { url?: string | null | undefined }) => {
  return (
    <ProfileImageContainer>
      {url ? (
        <ProfileImage
          width={100}
          height={100}
          src={url}
          alt="student picture"
        />
      ) : (
        <DefaultUserIcon />
      )}
    </ProfileImageContainer>
  );
};
