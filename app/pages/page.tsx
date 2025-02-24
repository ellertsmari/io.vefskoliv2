"use client"

import TodoList from "../components/todoList/todo";
import ToolsAndWebsites from "../components/widgets/Tools";

const homePage = () => {
  return (
    <div>
     <TodoList/>
     <ToolsAndWebsites />
    </div>
  );
}

export default homePage;
