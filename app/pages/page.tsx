"use client"

import TodoList from "../components/todoList/todo";
import ToolsAndWebsites from "../components/widgets/Tools";
import DailyPlan from "../components/dailyPlan/DailyPlan"

const homePage = () => {
  return (
    <div>
      <DailyPlan/>
     <TodoList/>
     <ToolsAndWebsites />
    </div>
  );
}

export default homePage;
