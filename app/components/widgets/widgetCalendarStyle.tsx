"use client";

import styled from "styled-components";
import Calendar from "react-calendar";

export const CalendarComponent = styled(Calendar)`
  .react-calendar__navigation__prev2-button,
  .react-calendar__navigation__next2-button,
  .react-calendar__navigation__prev-button,
  .react-calendar__navigation__next-button {
    background: white;
    border: 2px solid var(--main-Color);
    border-radius: 50%;
    /* width: 40px; */
    /* height: 40px; */
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    /* transition: all 0.2s ease-in-out; */

    &:hover {
      background-color: var(--main-Lightblue);
    }

    svg {
      color: var(--main-Color);
    }
  }
`;

// export const WidgetCalendarContainer = styled.div`
//   background: white;
//   padding: 20px;
//   border-radius: 8px;
//   width: 300px;
//   box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
// `;

// export const Header = styled.h2`
//   color: #2b5b76;
//   margin-bottom: 20px;
//   text-align: left;
//   font-size: 14px;
// `;

// export const Month = styled.div`
//   color: #2b5b76;
//   font-size: 18px;
//   font-weight: bold;
//   text-align: center;
//   margin-bottom: 10px;
// `;

// export const WeekDays = styled.div`
//   display: grid;
//   grid-template-columns: repeat(7, 1fr);
//   color: #a0a0a0;
//   text-align: center;
//   margin-bottom: 10px;
// `;

// export const Days = styled.div`
//   display: grid;
//   grid-template-columns: repeat(7, 1fr);
//   text-align: center;
// `;

// export const Day = styled.div<{ isToday: boolean; isCurrentMonth: boolean }>`
//   padding: 10px;
//   border-radius: 8px;
//   margin: 2px;
//   background: ${({ isToday }) => (isToday ? "#000" : "transparent")};
//   color: ${({ isToday, isCurrentMonth }) =>
//     isToday ? "#fff" : isCurrentMonth ? "#2b5b76" : "#d0d0d0"};
//   font-weight: ${({ isToday }) => (isToday ? "bold" : "normal")};
// `;

export const ContainerCalendar = styled.div`
  background: white;
  padding: 20px;
  border-radius: 8px;
  width: 300px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;
export const CircleArrowRight = styled.button``;
