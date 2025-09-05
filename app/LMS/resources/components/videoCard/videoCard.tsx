"use client";
import { Button } from "globalStyles/buttons/default/style";
import { UnstyledLink } from "globalStyles/globalStyles";
type Props = {
  link: string;
  title: string;
};

const VideoCard = ({ link, title }: Props) => {
  return (
    <Button $styletype="default">
      <UnstyledLink style={{ color: "white" }} target="_blank" href={link}>
        {title}
      </UnstyledLink>
    </Button>
  );
};

export default VideoCard;
