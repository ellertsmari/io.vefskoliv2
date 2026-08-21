"use client";
import { AvatarCircle, AvatarImage, AvatarInitials } from "./style";

export const getInitials = (name?: string | null) =>
  name
    ?.split(" ")
    .filter((w): w is string => !!w)
    .map((w) => w[0])
    .slice(0, 3)
    .join("")
    .toUpperCase() ?? "";

type Props = {
  name?: string | null;
  url?: string | null;
  /** Diameter in px. */
  size?: number;
};

/**
 * A user's picture, falling back to their initials. Avatars are stored as
 * inline data URLs, which carry no intrinsic dimensions, so next/image needs
 * `fill` and cannot run its optimizer over them.
 */
export const Avatar = ({ name, url, size = 58 }: Props) => (
  <AvatarCircle $size={size}>
    {url ? (
      <AvatarImage
        src={url}
        alt={name ? `${name}'s picture` : "User picture"}
        fill
        sizes={`${size}px`}
        unoptimized
      />
    ) : (
      <AvatarInitials $size={size} aria-hidden="true">
        {getInitials(name)}
      </AvatarInitials>
    )}
  </AvatarCircle>
);

export default Avatar;
