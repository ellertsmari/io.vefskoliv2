import ProgressB from "components/progress/progress";
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
       <ProgressB/>
    </div>
  );
};

export default HomePage;
