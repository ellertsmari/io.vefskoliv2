"use client"

import WidgetCalendar from "components/widgets/WidgetCalendar";
import TodoList from "../components/todoList/todo";
import ToolsAndWebsites from "../components/widgets/Tools";

const homePage = () => {
  return (
    <div>
     <TodoList/>
     <ToolsAndWebsites/>
     <WidgetCalendar/>
    </div>
  );
}

export default homePage;
