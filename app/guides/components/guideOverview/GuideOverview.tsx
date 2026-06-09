"use client";

import MarkdownReader from "UIcomponents/markdown/reader";
import { ReturnForm } from "../../../LMS/components/feedback/returnForm/ReturnForm";
import { ExerciseView } from "../exercise/ExerciseView";
import { Border, Wrapper, MaterialButton } from "globalStyles/globalStyles";
import { Heading1, SubHeading1, SubHeading1Bold } from "globalStyles/text";
import { ClientGuide, GradingMode } from "types/guideTypes";
import type { BestAttemptInfo } from "serverActions/getExerciseAttempts";
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
  isAuthenticated = true, // Default to true to maintain backwards compatibility
  bestAttempt,
}: {
  guide: ClientGuide;
  isAuthenticated?: boolean;
  bestAttempt?: BestAttemptInfo;
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
    module,
    topicsList,
    references,
  } = guide;

  // make rMaterials structure is the same as cMaterials
  const rMaterials = resources.map((material) => {
    return { title: material.description, link: material.link };
  });

  const refMaterials = references
    ? references.map((ref) => {
        return { title: ref.name, link: ref.link };
      })
    : [];

  const allMaterials = rMaterials.concat(cMaterials).concat(refMaterials);

  const isAutoGraded =
    guide.gradingMode === GradingMode.AUTO && !!guide.exercise;

  return (
    <Container>
      {module && <SubHeading1>{module.title}</SubHeading1>}
      <Heading1>{title}</Heading1>
      <Content>
        <Main>
          <Wrapper>
            <SubHeading1>DESCRIPTION</SubHeading1>
            <MarkdownReader>{description}</MarkdownReader>
          </Wrapper>
          {topicsList && (
            <Wrapper>
              <SubHeading1>TOPICS</SubHeading1>
              <MarkdownReader>{topicsList}</MarkdownReader>
            </Wrapper>
          )}
          <Wrapper>
            {(knowledge.length > 0 || skills.length > 0) && (
              <>
                <SubHeading1>GOALS</SubHeading1>
                <Border>
                  <Requirements>
                    {knowledge.length > 0 && (
                      <Wrapper>
                        <SubHeading1Bold>KNOWLEDGE</SubHeading1Bold>
                        {knowledge.map((knowledge) => {
                          return (
                            <MarkdownReader key={String(knowledge.knowledge)}>
                              {String(knowledge.knowledge)}
                            </MarkdownReader>
                          );
                        })}
                      </Wrapper>
                    )}
                    {skills.length > 0 && (
                      <Wrapper>
                        <SubHeading1Bold>SKILLS</SubHeading1Bold>
                        {skills.map((skills) => {
                          return (
                            <MarkdownReader key={String(skills.skill)}>
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
            <SubHeading1>{themeIdea.title || "REQUIREMENTS"}</SubHeading1>
            <MarkdownReader>{themeIdea.description}</MarkdownReader>
          </Wrapper>
        </Main>
        <Side>
          {allMaterials.length > 0 && (
            <Wrapper>
              <SubHeading1>MATERIALS</SubHeading1>
              <Border>
                <MaterialsWrapper>
                  {allMaterials.map((material) =>
                    /* Checking if the link has title if not it won't be displayed ---- FIX IT THE DATA BASE*/
                    material.title ? (
                      <a
                        key={material.link}
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
          {isAutoGraded ? (
            <ExerciseView
              guideId={guide._id.toString()}
              exercise={guide.exercise!}
              bestAttempt={bestAttempt}
            />
          ) : (
            <ReturnForm guideId={guide._id.toString()} />
          )}
        </ReturnWrapper>
      )}
    </Container>
  );
};
