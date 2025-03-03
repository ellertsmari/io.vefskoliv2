import { CircleArrowLeft, CircleArrowRight, CirclePlus } from "lucide-react";
import {

  Button,

  NavigationContainer,
  NavigationButton,
  LeftNav,
  ViewToggle,
 
  ViewToggleButton
} from "./style";
import moment from "moment";


const CustomToolbar: React.FC<any> = (toolbar) => {
    const goToBack = () => {
      toolbar.onNavigate("PREV");
    };

    const goToNext = () => {
      toolbar.onNavigate("NEXT");
    };

    const label = () => {
      const date = toolbar.date;
      if (toolbar.view === "month") {
        return moment(date).format("MMMM YYYY");
      }
      if (toolbar.view === "week") {
        const start = moment(date).startOf("week").format("MMM D");
        const end = moment(date).endOf("week").format("MMM D, YYYY");
        return `${start} - ${end}`;
      }
      if (toolbar.view === "day") {
        return moment(date).format("dddd, MMMM D, YYYY");
      }
      return "";
    };

    return (
      <NavigationContainer>
        <LeftNav>
          <NavigationButton onClick={goToBack}>
            <CircleArrowLeft />
          </NavigationButton>
          <span style={{ margin: "0 10px" }}>{label()}</span>
          <NavigationButton onClick={goToNext}>
            <CircleArrowRight />
          </NavigationButton>
        </LeftNav>

        <ViewToggle>
          <Button
            onClick={toolbar.onAddEvent}
            style={{ backgroundColor: "transparent", padding: "0px 12px" }}
          >
            <CirclePlus color="#2B5B76" />
          </Button>
          <ViewToggleButton
            onClick={() => toolbar.onView("month")}
            $active={toolbar.view === "month"}
          >
            Month
          </ViewToggleButton>
          <ViewToggleButton
            onClick={() => toolbar.onView("week")}
            $active={toolbar.view === "week"}
          >
            Week
          </ViewToggleButton>
        </ViewToggle>
      </NavigationContainer>
    );
  };


  export default CustomToolbar