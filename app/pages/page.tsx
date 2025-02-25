"use client";

import ProgressBar from "components/widgets/ProgressBar";
import { BoxContainer, ProgressContainer, ProgressWrapper, Progress, Title, Percentage } from "app/components/widgets/style";
import WidgetCalendar from "components/widgets/WidgetCalendar";
import TodoList from "../components/todoList/todo";
import ToolsAndWebsites from "../components/widgets/Tools";
import DailyPlan from "../components/dailyPlan/DailyPlan"

const HomePage = () => {
  return (
    <div>
      <TodoList />

      {/* Title outside BoxContainer */}
      <Title>School Progress</Title>

      <BoxContainer>
        <ProgressContainer>

          {/* Design Progress */}
          <ProgressWrapper>
            <span>Design progress</span> {/* Graph title */}
            <Progress>
              <ProgressBar progress={55} />
              <Percentage>{55}%</Percentage> {/* the percentage appears after the progress bar */}
            </Progress>
          </ProgressWrapper>

          {/* Code Progress */}
          <ProgressWrapper>
            <span>Code progress</span> {/* Graph title */}
            <Progress>
              <ProgressBar progress={35} />
              <Percentage>{35}%</Percentage> {/* the percentage appears after the progress bar */}
            </Progress>
          </ProgressWrapper>

        </ProgressContainer>
      </BoxContainer>

      <DailyPlan/>
     <WidgetCalendar/>
     <ToolsAndWebsites />
    </div>
  );
};

export default HomePage;
