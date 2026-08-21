import { ImageWrapper } from "./style";
import { SubHeading2 } from "globalStyles/text";
import { Avatar } from "UIcomponents/avatar/Avatar";

type Props = {
  url?: string | null | undefined;
  name: string | null | undefined;
  /** Avatar above the name, for the profile modal header. */
  stacked?: boolean;
};

const ProfilePicture = ({ url, name, stacked = false }: Props) => (
  <ImageWrapper $stacked={stacked}>
    <SubHeading2>{name}</SubHeading2>
    <Avatar name={name} url={url} size={stacked ? 72 : 58} />
  </ImageWrapper>
);

export default ProfilePicture;
