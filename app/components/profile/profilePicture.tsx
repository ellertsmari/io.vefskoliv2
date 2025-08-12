import {
  ProfileImageContainer,
  ProfileImage,
  ProfileInitials,
  ImageWrapper,
} from "./style";
import { SubHeading2 } from "globalStyles/text";

type Props = {
  url?: string | null | undefined;
  name: string | null | undefined;
};

const ProfilePicture = ({ url, name }: Props) => {
  const initials = name
  ?.split(" ")
  .filter((w): w is string => !!w)
  .map(w => w[0])
  .slice(0, 3)
  .join("")
  .toUpperCase()

  return (
    <ImageWrapper>
      <SubHeading2>{name}</SubHeading2>
      <ProfileImageContainer>
        {url ? (
          <ProfileImage src={url} alt="user picture" />
        ) : (
          <>
            <ProfileInitials>{initials}</ProfileInitials>
          </>
        )}
      </ProfileImageContainer>
    </ImageWrapper>
  );
};

export default ProfilePicture;
