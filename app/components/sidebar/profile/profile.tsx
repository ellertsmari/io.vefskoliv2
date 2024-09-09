"use client";
import {
  ProfileImage,
  ProfileImageContainer,
  ProfileName,
  ProfileWrapper,
  LogoutButton,
  LogoutIcon,
  Form,
  ProfileDetails,
  AdditionalInfo,
  ButtonWrapper,
  ProfileInfo,
  ImageAndLogout,
} from "./style";
import { SetStateAction, useState } from "react";
import Modal from "../../modal/modal";
import Input from "../../../globalStyles/input";
import logouticon from "../../../assets/logout.svg";
import DefaultButton from "../../../globalStyles/buttons/default";
import { signOut, updateUserInfo } from "../../../utils/actions";
import ProfilePic from "./Defaultuser.svg";
import { UserDocument } from "../../../models/user";
import { useSession } from "../../../providers/SessionProvider";

export const Profile = () => {
  //getting the user from session
  const session = useSession();
  //fix unknown later
  const user = session?.user as unknown as UserDocument;

  const ProfilePicture = (
    <ProfileWrapper>
      <ProfileImageContainer>
        <ProfileImage
          width={145}
          height={145}
          src={user?.avatarUrl ? user.avatarUrl : ProfilePic}
          alt="student picture"
        />
      </ProfileImageContainer>
      <ProfileName>{user.name}</ProfileName>
    </ProfileWrapper>
  );

  return (
    <div>
      {user ? (
        <Modal
          modalTrigger={ProfilePicture}
          modalContent={EditProfileScreen(user)}
        />
      ) : (
        <div>loading...</div>
      )}
    </div>
  );
};

const EditProfileScreen = (user: UserDocument) => {
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
        <ProfileInfo>
          <ProfileName style={{ fontSize: "16px" }}>{user.name}</ProfileName>
          <AdditionalInfo>{user.role}</AdditionalInfo>
          <AdditionalInfo style={{ color: "var(--primary-black-100)" }}>
            {user.email}
          </AdditionalInfo>
        </ProfileInfo>
        <ImageAndLogout>
          <ProfileImageContainer>
            <ProfileImage
              src={user.avatarUrl ? user.avatarUrl : ProfilePic}
              alt="student picture"
              width={60}
              height={60}
            />
          </ProfileImageContainer>
          <LogoutButton onClick={async () => await signOut()}>
            <p>LOGOUT</p>
            <LogoutIcon alt="logout button" src={logouticon} />
          </LogoutButton>
        </ImageAndLogout>
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
