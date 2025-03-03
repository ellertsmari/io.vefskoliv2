"use client";

import { useState } from "react";
import Calendar from "react-calendar";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
} from "date-fns";
import { CalendarComponent, ContainerMain, Title, Days, WeekDays, Month, Header, Day } from "./style";

type ValuePiece = Date | null;

type Value = ValuePiece | [ValuePiece, ValuePiece];

function WidgetCalendar() {
  const [value, onChange] = useState<Value>(new Date());

    const [currentDate, setCurrentDate] = useState(new Date());

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    // const dateFormat = "d";
    // const days = [];

    // let day = startDate;

    // while (day <= endDate) {
    //   days.push(
    //     <Day
    //       key={day.toString()}
    //       isToday={isSameDay(day, new Date())}
    //       isCurrentMonth={isSameMonth(day, monthStart)}
    //     >
    //       {format(day, dateFormat)}
    //     </Day>
    //   );
    //   day = addDays(day, 1);
    // }

  return (
    <>
    <ContainerMain>
      <Title>Calendar</Title>
        <CalendarComponent 
          navigationLabel={({ date, label, locale, view }) =>
          view === "month"
          ? date.toLocaleDateString(locale, { month: "long" })
          : label} 
        onChange={()=> onChange(value)} value={value} locale="en-EN" />
      </ContainerMain>
      </>
  );
}

export default WidgetCalendar;
