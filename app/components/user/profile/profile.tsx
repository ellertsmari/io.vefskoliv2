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
  ProfileBar,
} from "./style";
import ProfilePicture from "./profilePicture";
import Modal from "UIcomponents/modal/modal";
import { Input } from "UIcomponents/input/Input";
import { ImageUploadField } from "UIcomponents/imageUpload/ImageUploadField";
import DefaultButton from "globalStyles/buttons/default";
import { LogoutIcon } from "assets/Icons";
import { signOut } from "serverActions/signOut";
import { updateUserInfo } from "serverActions/updateUserInfo";
import { Wrapper } from "globalStyles/globalStyles";
import { Session } from "next-auth";
import { AdapterUser } from "next-auth/adapters";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserAliasDropdown } from "../userAliasDropdown/UserAliasDropdown";

export const Profile = ({ session }: { session: Session | null }) => {
  const user = session?.user as AdapterUser;
  const modalState = useState(false);

  return (
    <Wrapper>
      {user ? (
        <ProfileBar>
          <UserAliasDropdown session={session} />
          <Modal
            state={modalState}
            modalTrigger={<ProfilePicture name={user.name} url={user.avatarUrl} />}
            modalContent={
              <EditProfileScreen
                user={user}
                onSaved={() => modalState[1](false)}
              />
            }
          />
        </ProfileBar>
      ) : (
        <div>loading…</div>
      )}
    </Wrapper>
  );
};

const EditProfileScreen = ({
  user,
  onSaved,
}: {
  user: AdapterUser;
  onSaved: () => void;
}) => {
  const [userInfo, setUserInfo] = useState({
    avatarUrl: user?.avatarUrl || "",
    background: user?.background || "",
    careerGoals: user?.careerGoals || "",
    interests: user?.interests || "",
    favoriteArtists: user?.favoriteArtists || "",
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, startSave] = useTransition();
  const router = useRouter();

  const onSave = () => {
    setError(null);
    startSave(async () => {
      const result = await updateUserInfo(userInfo);
      if (!result.success) {
        setError(result.message);
        return;
      }
      // The save refreshed the session cookie; re-render the header from it.
      router.refresh();
      onSaved();
    });
  };

  const { avatarUrl, background, careerGoals, interests, favoriteArtists } =
    userInfo;

  return (
    <ProfileWrapper>
      <ProfileDetails>
        <ProfilePicture name={user.name} url={avatarUrl || null} stacked />
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
      <Form onSubmit={(e) => e.preventDefault()}>
        <ImageUploadField
          id="avatarUrl"
          prefix="avatar"
          label="PROFILE PICTURE"
          description="Shown next to your name across the site."
          value={avatarUrl}
          onChange={(value) => setUserInfo({ ...userInfo, avatarUrl: value })}
          disabled={saving}
        />
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
      {error && (
        <AdditionalInfo role="alert" style={{ color: "var(--error-warning-100)" }}>
          {error}
        </AdditionalInfo>
      )}
      <ButtonWrapper>
        <DefaultButton style="default" onClick={onSave} disabled={saving}>
          {saving ? "SAVING…" : "SAVE"}
        </DefaultButton>
        <DefaultButton style="outlined">CHANGE PASSWORD</DefaultButton>
      </ButtonWrapper>
    </ProfileWrapper>
  );
};
