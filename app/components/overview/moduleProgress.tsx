"use server";
import { getGuides } from "serverActions/getGuides";
import {
  MainContainer,
  ModulesWrapper,
  Title,
  GradeText,
  GradeContainer,
  ProgressBar,
  StyledProgress,
  StyleNameMod,
  Grade,
  ContainerBar,
  Progress,
} from "./style";
import { auth } from "auth";

const modules = [
  { name: "Module I", progress: 100, grade: 0, numberOfGuides:0, guidesReturned:0 },
  { name: "Module II", progress: 54, grade: 0, numberOfGuides:0, guidesReturned:0 },
  { name: "Module III", progress: 30, grade: 0, numberOfGuides:0, guidesReturned:0 },
  { name: "Module IV", progress: 75, grade: 0, numberOfGuides:0 , guidesReturned:0},
  { name: "Module V", progress: 62, grade: 0, numberOfGuides:0, guidesReturned:0 },
  { name: "Module VI", progress: 5, grade: 0, numberOfGuides:0, guidesReturned:0 },
  { name: "Module VII", progress: 15, grade: 0, numberOfGuides:0 , guidesReturned:0, },
];

export const ModulesProgress = async () => {
const session= await auth()
const userId= session?.user?.id
const guides=await getGuides(userId as string)
console.log (guides)
guides?.forEach((guide) => {
    console.log (guide)
    const moduleNumber= Number(guide.module.title[0])
    if (moduleNumber){
        modules[moduleNumber-1].numberOfGuides++
        if(guide.returnsSubmitted.length){
            modules[moduleNumber-1].guidesReturned++
        }
        if (guide.gradesGiven.length){
            modules[moduleNumber-1].grade++
        }
    }



})


  return (
    <MainContainer>
      <Title>Overwiew</Title>
      <ModulesWrapper>
        {modules.map((module, index) => (
          <ContainerBar
            key={index}
            style={{ display: "flex", gap: "12px", alignItems: "center" }}
          >
            <StyleNameMod>{module.name}</StyleNameMod>
            <StyledProgress id="file">
              <Progress $value={module.guidesReturned/module.numberOfGuides*100}></Progress>
            </StyledProgress>
            <ProgressBar>{Math.round(module.guidesReturned/module.numberOfGuides*100)}%</ProgressBar>
            <GradeContainer>
              <GradeText>Grade </GradeText>
              <Grade>{module.grade}</Grade>
            </GradeContainer>
          </ContainerBar>
        ))}
      </ModulesWrapper>
    </MainContainer>
  );
};
