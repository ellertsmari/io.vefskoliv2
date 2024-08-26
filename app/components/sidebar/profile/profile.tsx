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
import { useState } from "react";
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
  const user = session?.user as unknown as UserWithIdType;

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
                placeholder={user.background}
                label="BACKGROUND"
              />
              <Input
                type="text"
                placeholder={user.careerGoals}
                label="NEAR FUTURE CAREER GOALS"
              />
              <Input
                type="text"
                placeholder={user.interests}
                label="MAIN INTERESTS"
              />
              <Input
                type="text"
                placeholder={user.favoriteArtists}
                label="FAVORITE BAND/ARTIST"
              />
            </Form>
            <ButtonWrapper>
              <DefaultButton style="default">SAVE</DefaultButton>
              <DefaultButton style="outlined">CHANGE PASSWORD</DefaultButton>
            </ButtonWrapper>
          </ModalContent>
        </Modal>
      )}
    </div>
  );
};
