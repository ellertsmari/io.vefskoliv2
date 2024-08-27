"use client";
import {
  ProfileImage,
  ProfileImageContainer,
  ProfileName,
  ProfileWrapper,
  ModalContent,
  ExitAndLogoutWrapper,
  LogoutButton,
  LogoutIcon,
  Form,
  ProfileDetails,
  AdditionalInfo,
  ButtonWrapper,
} from "./style";
import { SetStateAction, useState } from "react";
import Modal from "../../modal/modal";
import Input from "../../../globalStyles/input";
import ExitButton from "../../../globalStyles/buttons/exit";
import logouticon from "../../../assets/logout.svg";
import DefaultButton from "../../../globalStyles/buttons/default";
import { signOut } from "../../../utils/actions";
import ProfilePic from "./Defaultuser.svg";
import { UserWithIdType } from "../../../models/user";
import { useSession } from "../../../providers/SessionProvider";


export const Profile = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  //getting the user from session
  const session = useSession();
  //fix unknown later
  const user = session?.user as unknown as UserDocument;

  const [background, setBackground] = useState(user?.background || "");
  const [careerGoals, setCareerGoals] = useState(user?.careerGoals || "");
  const [interests, setInterests] = useState(user?.interests || "");
  const [favoriteArtists, setFavoriteArtists] = useState(
    user?.favoriteArtists || ""
  );

  const onSave = async () => {
    console.log("onSave called");
    updateUserInfo(user.email, {
      background,
      careerGoals,
      interests,
      favoriteArtists,
    });
  };

  return (
    <div>
      {user ? (
        <>
          <ProfileWrapper>
            <ProfileImageContainer>
              <ProfileImage
                onClick={() => setIsModalOpen(!isModalOpen)}
                width={145}
                height={145}
                src={user?.avatarUrl ? user.avatarUrl : ProfilePic}
                alt="student picture"
              />
            </ProfileImageContainer>
            <ProfileName>{user.name}</ProfileName>
          </ProfileWrapper>
        </>
      ) : (
        <div>loading...</div>
      )}

      {isModalOpen && (
        <Modal
          onClick={() => setIsModalOpen(!isModalOpen)}
          shouldShow={isModalOpen}
        >
          <ModalContent>
            <ExitAndLogoutWrapper>
              <ExitButton onClick={() => setIsModalOpen(!isModalOpen)} />
              <LogoutButton onClick={async () => await signOut()}>
                <p>LOGOUT</p>
                <LogoutIcon alt="logout button" src={logouticon} />
              </LogoutButton>
            </ExitAndLogoutWrapper>
            <ProfileDetails>
              <ProfileImageContainer>
                <ProfileImage
                  src={user.avatarUrl ? user.avatarUrl : ProfilePic}
                  alt="student picture"
                  width={145}
                  height={145}
                />
              </ProfileImageContainer>
              <ProfileName style={{ fontSize: "16px" }}>
                {user.name}
              </ProfileName>
              <AdditionalInfo>{user.role}</AdditionalInfo>
              <AdditionalInfo style={{ color: "var(--primary-black-100)" }}>
                {user.email}
              </AdditionalInfo>
            </ProfileDetails>
            <Form>
              <Input
                type="text"
                value={background}
                onChange={(e: { target: { value: SetStateAction<string> } }) =>
                  setBackground(e.target.value)
                }
                label="BACKGROUND"
              />
              <Input
                type="text"
                value={careerGoals}
                onChange={(e: { target: { value: SetStateAction<string> } }) =>
                  setCareerGoals(e.target.value)
                }
                label="NEAR FUTURE CAREER GOALS"
              />
              <Input
                type="text"
                placeholder={user.interests}
                value={interests}
                onChange={(e: { target: { value: SetStateAction<string> } }) =>
                  setInterests(e.target.value)
                }
                label="MAIN INTERESTS"
              />
              <Input
                type="text"
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
          </ModalContent>
        </Modal>
      )}
    </div>
  );
};
