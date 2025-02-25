"use client"

import WidgetCalendar from "components/widgets/WidgetCalendar";
import TodoList from "../components/todoList/todo";
import ToolsAndWebsites from "../components/widgets/Tools";
import DailyPlan from "../components/dailyPlan/DailyPlan"

const homePage = () => {
  return (
    <div>
      <DailyPlan/>
     <TodoList/>
     <ToolsAndWebsites/>
     <WidgetCalendar/>
     <ToolsAndWebsites />
    </div>
  );
}

export default homePage;
