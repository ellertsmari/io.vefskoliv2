import { Container, IconImage, ModulesText1, ModulesText2 } from "./style";
import Figmaimg from "../../assets/Component 1.svg";

const ModulesInfo = () => {
  return (
    <>
        <Container>
          <IconImage alt="figma icon" src={Figmaimg} />
          <div>
            <ModulesText1>Module 2</ModulesText1>
            <ModulesText2>10 guides</ModulesText2>
          </div>
        </Container>
    </>
  );
};

export default ModulesInfo;
