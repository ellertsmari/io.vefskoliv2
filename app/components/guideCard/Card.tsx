import { StyledLink, Info, GuideNr, Name } from "./style";

export const Card = ({
  guideTitle,
  moduleTitle,
  order,
  link,
}: {
  guideTitle: string;
  moduleTitle: string;
  order?: number;
  link?: string;
}) => {
  return (
    <>
      <StyledLink href={link}>
        <Info>
          <GuideNr>
            {order ? `GUIDE ${order}` : `MODULE ${moduleTitle}`}
          </GuideNr>
          <Name>{guideTitle}</Name>
        </Info>
      </StyledLink>
    </>
  );
};
