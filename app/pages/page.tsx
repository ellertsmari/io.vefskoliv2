"use client"

import TodoList from "../components/todoList/todo";
import DailyPlan from "../components/dailyPlan/DailyPlan"

const homePage = () => {
  return (
    <div>
      <DailyPlan/>
     <TodoList/>
    </div>
  );
}

export default homePage;
