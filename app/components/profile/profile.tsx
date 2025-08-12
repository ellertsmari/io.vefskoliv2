"use client";
import {
  ProfileWrapper,
  LogoutButton,
  Form,
  ProfileDetails,
  AdditionalInfo,
  ButtonWrapper,
  ProfileInfo,
  Logout,
} from "./style";
import ProfilePicture from "./profilePicture";
import Modal from "UIcomponents/modal/modal";
import { Input } from "UIcomponents/input/Input";
import DefaultButton from "globalStyles/buttons/default";
import { LogoutIcon } from "assets/Icons";
import { signOut } from "serverActions/signOut";
import { updateUserInfo } from "serverActions/updateUserInfo";
import { Wrapper } from "globalStyles/globalStyles";
import { Session } from "next-auth";
import { AdapterUser } from "next-auth/adapters";
import { useState } from "react";

export const Profile = ({ session }: { session: Session | null }) => {
  const user = session?.user as AdapterUser;

  const ProfilePictureContainer = () => {
    return (
        <ProfilePicture name={user.name} url={user.avatarUrl} />
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
        <ProfilePicture name={user.name} url={user.avatarUrl} />
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
    </ProfileWrapper>
  );
};



