"use client";

import ProgressBar from "components/widgets/ProgressBar";
import TodoList from "../components/todoList/todo";
import { BoxContainer, ProgressContainer, ProgressWrapper, Progress, Title, Percentage } from "app/components/widgets/style";

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
    </div>
  );
};

export default HomePage;
