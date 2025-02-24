"use client";

import {
  ProfileImage,
  ProfileImageContainer,
  ProfileWrapper,
  ImageWrapper,
  LogoutButton,
  Form,
  ProfileDetails,
  AdditionalInfo,
  ButtonWrapper,
  ProfileInfo,
  Logout,
} from "./style";
import Modal from "UIcomponents/modal/modal";
import { Input } from "UIcomponents/input/Input";
import DefaultButton from "globalStyles/buttons/default";
import { DefaultUserIcon } from "assets/Icons";
import { LogoutIcon } from "assets/Icons";
import { signOut } from "serverActions/signOut";
import { updateUserInfo } from "serverActions/updateUserInfo";
import { useState } from "react";
import { Session } from "next-auth";
import { AdapterUser } from "next-auth/adapters";
import { Wrapper } from "globalStyles/globalStyles";

export const Profile = ({ session }: { session: Session | null }) => {
  const user = session?.user as AdapterUser;

  const ProfilePictureContainer = () => {
    return (
      <ImageWrapper>
        <ProfilePicture url={user?.avatarUrl} />
      </ImageWrapper>
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

const EditProfileScreen = ({ user }: { user: AdapterUser }) => {
  const [userInfo, setUserInfo] = useState({
    background: user?.background || "",
    careerGoals: user?.careerGoals || "",
    interests: user?.interests || "",
    favoriteArtists: user?.favoriteArtists || "",
  });

  const onSave = async () => {
    await updateUserInfo(userInfo);
  };

  const { background, careerGoals, interests, favoriteArtists } = userInfo;

  return (
    <ProfileWrapper>
      <ProfileDetails>
        <ProfilePicture url={user.avatarUrl} />
        <ProfileInfo>
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
          onChange={(e: { target: { value: any } }) =>
            setUserInfo({ ...userInfo, background: e.target.value })
          }
          label="BACKGROUND"
        />
        <Input
          type="text"
          id="careerGoals"
          value={careerGoals}
          onChange={(e: { target: { value: any } }) =>
            setUserInfo({ ...userInfo, careerGoals: e.target.value })
          }
          label="NEAR FUTURE CAREER GOALS"
        />
        <Input
          type="text"
          id="interests"
          value={interests}
          onChange={(e: { target: { value: any } }) =>
            setUserInfo({ ...userInfo, interests: e.target.value })
          }
          label="MAIN INTERESTS"
        />
        <Input
          type="text"
          id="favoriteArtists"
          value={favoriteArtists}
          onChange={(e: { target: { value: any } }) =>
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
    </ProfileWrapper>
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
