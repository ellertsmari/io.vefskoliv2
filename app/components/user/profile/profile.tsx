"use client";
import {
  ProfileWrapper,
  LogoutButton,
  Form,
  ProfileDetails,
  AdditionalInfo,
  UserEmail,
  ButtonWrapper,
  ProfileInfo,
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
import { UserAliasDropdown } from "../userAliasDropdown/UserAliasDropdown";

export const Profile = ({ session }: { session: Session | null }) => {
  const user = session?.user as AdapterUser;

  return (
    <Wrapper>
      {user ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <UserAliasDropdown session={session} />
          <Modal
            modalTrigger={<ProfilePicture name={user.name} url={user.avatarUrl} />}
            modalContent={<EditProfileScreen user={user} />}
          />
        </div>
      ) : (
        <div>loading…</div>
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
        <ProfilePicture name={user.name} url={user.avatarUrl} stacked />
        <ProfileInfo>
          <AdditionalInfo>{user.role}</AdditionalInfo>
          <UserEmail>{user.email}</UserEmail>
        </ProfileInfo>
        <LogoutButton
          type="button"
          onClick={async () => await signOut({ redirectTo: "/" })}
          aria-label="logout button"
        >
          LOGOUT
          <LogoutIcon size={14} />
        </LogoutButton>
      </ProfileDetails>
      <Form>
        <Input
          type="text"
          id="background"
          value={background}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setUserInfo({ ...userInfo, background: e.target.value });
          }}
          label="BACKGROUND"
        />
        <Input
          type="text"
          id="careerGoals"
          value={careerGoals}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setUserInfo({ ...userInfo, careerGoals: e.target.value });
          }}
          label="NEAR FUTURE CAREER GOALS"
        />
        <Input
          type="text"
          id="interests"
          placeholder={user.interests}
          value={interests}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setUserInfo({ ...userInfo, interests: e.target.value })
          }
          label="MAIN INTERESTS"
        />
        <Input
          type="text"
          id="favoriteArtists"
          value={favoriteArtists}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
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



