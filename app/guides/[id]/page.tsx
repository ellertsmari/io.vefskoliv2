import {
  Title,
  SubTitle,
  Wrapper,
  Border,
  Container,
  Main,
  Side,
  Content,
  BlackSubTitle,
  Requirements,
  KnowledgeAndSkills,
  ReturnWrapper,
  MaterialsWrapper,
  MaterialButton,
} from "./style";

import MarkdownReader from "../../components/markdown/reader";
import ReturnForm from "./returnForm";
import { getGuide } from "../../utils/actions";

//displaying the guide here
const Guide = async ({ params }: { params: { id: string } }) => {
  const guide = await getGuide(params.id);

  if (!guide) {
    return (
      <>
        <h1>Guide not found</h1>
        <h2>{params.id}</h2>
      </>
    );
  }

  const {
    title,
    description,
    themeIdea,
    knowledge,
    skills,
    resources,
    classes,
  } = guide;

  const rMaterials = resources.map((material) => {
    return { title: material.description, link: material.link };
  });
  const cMaterials = JSON.parse(JSON.stringify(classes));
  const allMaterials = rMaterials.concat(cMaterials);

  return (
    <Container>
      <Title>{title}</Title>
      <Content>
        <Main>
          <Wrapper>
            <SubTitle>DESCRIPTION</SubTitle>
            <MarkdownReader>{description}</MarkdownReader>
          </Wrapper>
          <Wrapper>
            {(knowledge.length > 0 || skills.length > 0) && (
              <>
                <SubTitle>GOALS</SubTitle>
                <Border>
                  <Requirements>
                    {knowledge.length > 0 && (
                      <KnowledgeAndSkills>
                        <BlackSubTitle>KNOWLEDGE</BlackSubTitle>
                        {knowledge.map((knowledge, index) => {
                          return (
                            <MarkdownReader key={index}>
                              {String(knowledge.knowledge)}
                            </MarkdownReader>
                          );
                        })}
                      </KnowledgeAndSkills>
                    )}
                    {skills.length > 0 && (
                      <KnowledgeAndSkills>
                        <BlackSubTitle>SKILLS</BlackSubTitle>
                        {skills.map((skills, index) => {
                          return (
                            <MarkdownReader key={index}>
                              {String(skills.skill)}
                            </MarkdownReader>
                          );
                        })}
                      </KnowledgeAndSkills>
                    )}
                  </Requirements>
                </Border>
              </>
            )}
          </Wrapper>
          <Wrapper>
            <SubTitle>REQUIREMENTS</SubTitle>
            <MarkdownReader>{themeIdea.description}</MarkdownReader>
          </Wrapper>
        </Main>
        <Side>
          {allMaterials.length > 0 && (
            <Wrapper>
              <SubTitle>MATERIALS</SubTitle>
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

      <ReturnWrapper>
        <ReturnForm />
      </ReturnWrapper>
    </Container>
  );
};

export default Guide;
