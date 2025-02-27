"use client";

import ProgressBar from "components/widgets/ProgressBar";
import {
  ProgressContainer,
  ProgressWrapper,
  Progress,
  Title,
  Percentage,
} from "app/components/widgets/style";
import WidgetCalendar from "components/widgets/WidgetCalendar";
import TodoList from "../components/todoList/todo";
import ToolsAndWebsites from "../components/widgets/Tools";
import DailyPlan from "../components/dailyPlan/DailyPlan";
import { ModulesProgress } from "../components/overview/moduleProgress";
import {
  Widgetlayout,
  LayoutToolsandTodo,
  LayoutPlanCal,
  PageContainer,
  OverviewContainer,
  SchoolProgressContainer,
  BoxContainer,
} from "../../app/pages/style";

const HomePage = () => {
  return (
    <PageContainer>
      <Widgetlayout>
        <OverviewContainer>
          <ModulesProgress />
        </OverviewContainer>
        <BoxContainer>
          <LayoutPlanCal>
            <DailyPlan />
            <WidgetCalendar />
          </LayoutPlanCal>
          <LayoutToolsandTodo>
            <ToolsAndWebsites />
            <TodoList />
          </LayoutToolsandTodo>
        </BoxContainer>
      </Widgetlayout>

      {/* Title outside BoxContainer */}
      <SchoolProgressContainer>
        <Title>School Progress</Title>

        <BoxContainer>
          <ProgressContainer>
            {/* Design Progress */}
            <ProgressWrapper>
              <span>Design progress</span> {/* Graph title */}
              <Progress>
                <ProgressBar progress={55} />
                <Percentage>{55}%</Percentage>{" "}
                {/* the percentage appears after the progress bar */}
              </Progress>
            </ProgressWrapper>

            {/* Code Progress */}
            <ProgressWrapper>
              <span>Code progress</span> {/* Graph title */}
              <Progress>
                <ProgressBar progress={35} />
                <Percentage>{35}%</Percentage>{" "}
                {/* the percentage appears after the progress bar */}
              </Progress>
            </ProgressWrapper>
          </ProgressContainer>
        </BoxContainer>
      </SchoolProgressContainer>
    </PageContainer>
  );
};

export default HomePage;
