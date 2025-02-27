import { MainContainer, ModulesWrapper, Title, GradeText, GradeContainer, ProgressBar, StyledProgress, StyleNameMod, Grade, ContainerBar } from "./style"

const modules = [
    { name: "Module I", progress: 100, grade: 9.5 },
    { name: "Module II", progress: 54, grade: 9.5 },
    { name: "Module III", progress: 30, grade: 9.5 },
    { name: "Module IV", progress: 75, grade: 9.5 },
    { name: "Module V", progress: 62, grade: 9.5 },
    { name: "Module VI", progress: 5, grade: 9.5 },
    { name: "Module VII", progress: 15, grade: 9.5 },
  ];

export const ModulesProgress = () => {
    return (
        <MainContainer>
            <Title>Overwiew</Title>
            <ModulesWrapper >
                
                {modules.map((module, index) => (
                    <ContainerBar key={index} style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                        <StyleNameMod>{module.name}</StyleNameMod>
                        <StyledProgress id="file" max="100" value={module.progress}></StyledProgress>
                        <ProgressBar>{module.progress}%</ProgressBar>
                        <GradeContainer>
                        <GradeText>Grade </GradeText>
                        <Grade>
                        {module.grade}
                        </Grade>
                        </GradeContainer>
                    </ContainerBar>
                ))}
           </ModulesWrapper>
        </MainContainer>
    );
}