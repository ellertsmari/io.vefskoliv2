"use client";

import MarkdownReader from "UIcomponents/markdown/reader";
import { ReturnForm } from "../../../LMS/components/feedback/returnForm/ReturnForm";
import { Border, Wrapper, MaterialButton } from "globalStyles/globalStyles";
import { Heading1, SubHeading1, SubHeading1Bold } from "globalStyles/text";
import { GuideType } from "models/guide";
import {
  Main,
  Side,
  MaterialsWrapper,
  ReturnWrapper,
  Requirements,
  Content,
  Container,
} from "./style";

export const GuideOverview = ({ 
  guide, 
  isAuthenticated = true // Default to true to maintain backwards compatibility
}: { 
  guide: GuideType; 
  isAuthenticated?: boolean;
}) => {
  if (!guide) {
    return <h1>Guide not found</h1>;
  }

  const {
    title,
    description,
    knowledge,
    skills,
    themeIdea,
    resources,
    classes: cMaterials,
  } = guide;

  // make rMaterials structure is the same as cMaterials
  const rMaterials = resources.map((material) => {
    return { title: material.description, link: material.link };
  });
  const allMaterials = rMaterials.concat(cMaterials);

  return (
    <Container>
      <Heading1>{title}</Heading1>
      <Content>
        <Main>
          <Wrapper>
            <SubHeading1>DESCRIPTION</SubHeading1>
            <MarkdownReader>{description}</MarkdownReader>
          </Wrapper>
          <Wrapper>
            {(knowledge.length > 0 || skills.length > 0) && (
              <>
                <SubHeading1>GOALS</SubHeading1>
                <Border>
                  <Requirements>
                    {knowledge.length > 0 && (
                      <Wrapper>
                        <SubHeading1Bold>KNOWLEDGE</SubHeading1Bold>
                        {knowledge.map((knowledge, index) => {
                          return (
                            <MarkdownReader key={index}>
                              {String(knowledge.knowledge)}
                            </MarkdownReader>
                          );
                        })}
                      </Wrapper>
                    )}
                    {skills.length > 0 && (
                      <Wrapper>
                        <SubHeading1Bold>SKILLS</SubHeading1Bold>
                        {skills.map((skills, index) => {
                          return (
                            <MarkdownReader key={index}>
                              {String(skills.skill)}
                            </MarkdownReader>
                          );
                        })}
                      </Wrapper>
                    )}
                  </Requirements>
                </Border>
              </>
            )}
          </Wrapper>
          <Wrapper>
            <SubHeading1>REQUIREMENTS</SubHeading1>
            <MarkdownReader>{themeIdea.description}</MarkdownReader>
          </Wrapper>
        </Main>
        <Side>
          {allMaterials.length > 0 && (
            <Wrapper>
              <SubHeading1>MATERIALS</SubHeading1>
              <Border>
                <MaterialsWrapper>
                  {allMaterials.map((material, index) =>
                    /* Checking if the link has title if not it won't be displayed ---- FIX IT THE DATA BASE*/
                    material.title ? (
                      <a
                        key={index}
                        style={{ textDecoration: "none" }}
                        href={material.link}
                        target="_blank"
                      >
                        <MaterialButton $styletype="default">
                          {material.title}
                        </MaterialButton>
                      </a>
                    ) : null
                  )}
                </MaterialsWrapper>
              </Border>
            </Wrapper>
          )}
        </Side>
      </Content>

      {isAuthenticated && (
        <ReturnWrapper>
          <ReturnForm guideId={guide._id.toString()} />
        </ReturnWrapper>
      )}
    </Container>
  );
};
