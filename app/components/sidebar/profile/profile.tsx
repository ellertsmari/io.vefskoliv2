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
import { SetStateAction, useState } from "react";
import Modal from "../../modal/modal";
import Input from "../../../globalStyles/input";
import DefaultButton from "../../../globalStyles/buttons/default";
import { signOut, updateUserInfo } from "../../../utils/serverActions";
import { DefaultUserIcon } from "../../../assets/Icons";
import { UserDocument } from "../../../models/user";
import { useSession } from "../../../providers/SessionProvider";
import { LogoutIcon } from "../../../assets/Icons";

export const Profile = () => {
  //getting the user from session
  const session = useSession();
  //fix unknown later
  const user = session?.user as unknown as UserDocument;

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

const EditProfileScreen = ({ user }: { user: UserDocument }) => {
  const [background, setBackground] = useState(user?.background || "");
  const [careerGoals, setCareerGoals] = useState(user?.careerGoals || "");
  const [interests, setInterests] = useState(user?.interests || "");
  const [favoriteArtists, setFavoriteArtists] = useState(
    user?.favoriteArtists || ""
  );

  const onSave = async () => {
    updateUserInfo(user.email, {
      background,
      careerGoals,
      interests,
      favoriteArtists,
    });
  };

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
          onChange={(e: { target: { value: SetStateAction<string> } }) =>
            setBackground(e.target.value)
          }
          label="BACKGROUND"
        />
        <Input
          type="text"
          id="careerGoals"
          value={careerGoals}
          onChange={(e: { target: { value: SetStateAction<string> } }) =>
            setCareerGoals(e.target.value)
          }
          label="NEAR FUTURE CAREER GOALS"
        />
        <Input
          type="text"
          id="interests"
          placeholder={user.interests}
          value={interests}
          onChange={(e: { target: { value: SetStateAction<string> } }) =>
            setInterests(e.target.value)
          }
          label="MAIN INTERESTS"
        />
        <Input
          type="text"
          id="favoriteArtists"
          value={favoriteArtists}
          onChange={(e: { target: { value: SetStateAction<string> } }) =>
            setFavoriteArtists(e.target.value)
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
