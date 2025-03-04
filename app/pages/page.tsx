import ProgressB from "components/progressBar/progress";
import TodoList from "../components/todoList/todo";
import ToolsAndWebsites from "../components/tools/Tools";
import { ModulesProgress } from "../components/overview/moduleProgress";
import {
  Widgetlayout,
  LayoutToolsandTodo,
  PageContainer,
  OverviewContainer,
  BoxContainer,
} from "../../app/pages/style";
import ConnectCalendar from "components/connectCalendar/connectCalendar";

const HomePage = () => {
  return (
    <PageContainer>
      <Widgetlayout>
        <OverviewContainer>
          <ModulesProgress />
        </OverviewContainer>
        <BoxContainer>
           <ConnectCalendar/>
          <LayoutToolsandTodo>
            <ToolsAndWebsites />
            <TodoList />
          </LayoutToolsandTodo>
        </BoxContainer>
      </Widgetlayout>
      <ProgressB />
    </PageContainer>
  );
};

export default HomePage;
