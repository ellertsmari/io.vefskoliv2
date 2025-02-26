"use client";

import MarkdownReader from "UIcomponents/markdown/reader";
import { ReturnForm } from "components/returnForm/ReturnForm";
import { Wrapper, MaterialButton } from "globalStyles/globalStyles";
import { Title, SubTitle, BlueSubTitle } from "globalStyles/text";
import { GuideType } from "models/guide";
import {
  Main,
  Side,
  MaterialsWrapper,
  ReturnWrapper,
  Requirements,
  Content,
  Container,
  RequirementsWrapper,
  Footer,
} from "./style";

export const GuideOverview = ({ guide }: { guide: GuideType }) => {
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
      <Title>{title}</Title>
      <Content>
        <Main>
          <Wrapper>
            <SubTitle>Description</SubTitle>
            <MarkdownReader>{description}</MarkdownReader>
          </Wrapper>
          <Wrapper>
            <Wrapper>
              <MarkdownReader>{themeIdea.description}</MarkdownReader>
            </Wrapper>
          </Wrapper>
        </Main>
        <Side>
          {allMaterials.length > 0 && (
            <Wrapper>
              <SubTitle>MATERIALS</SubTitle>

              <MaterialsWrapper>
                {allMaterials.map((material, index) =>
                  /* Checking if the link has title if not it won't be displayed ---- FIX IT THE DATA BASE*/
                  material.title ? (
                    <a
                      key={index}
                      style={{ textDecoration: "none", margin: "0px" }}
                      href={material.link}
                      target="_blank"
                    >
                      <MaterialButton $styletype="outlined">
                        {material.title}
                      </MaterialButton>
                    </a>
                  ) : null,
                )}
              </MaterialsWrapper>
            </Wrapper>
          )}
        </Side>
        <Footer>
          {(knowledge.length > 0 || skills.length > 0) && (
            <>
              <SubTitle>Requirements</SubTitle>

              <Requirements>
                {knowledge.length > 0 && (
                  <RequirementsWrapper>
                    <BlueSubTitle>Knowledge</BlueSubTitle>
                    {knowledge.map((knowledge, index) => {
                      return (
                        <MarkdownReader key={index}>
                          {String(knowledge.knowledge)}
                        </MarkdownReader>
                      );
                    })}
                  </RequirementsWrapper>
                )}
                {skills.length > 0 && (
                  <RequirementsWrapper>
                    <BlueSubTitle>SKILLS</BlueSubTitle>
                    {skills.map((skills, index) => {
                      return (
                        <MarkdownReader key={index}>
                          {String(skills.skill)}
                        </MarkdownReader>
                      );
                    })}
                  </RequirementsWrapper>
                )}
              </Requirements>
            </>
          )}
        </Footer>
      </Content>

      <ReturnWrapper>
        <ReturnForm guideId={guide._id.toString()} />
      </ReturnWrapper>
    </Container>
  );
};
