"use client";

import { Dispatch, SetStateAction, useState } from "react";
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
import { Event as CalendarEvent } from "react-big-calendar";

type ValuePiece = Date | null;

type Value = ValuePiece | [ValuePiece, ValuePiece];

interface Event extends CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  color: string;
}

type Props={
today: Date,
setToday:Dispatch<SetStateAction<Date>>
}

function WidgetCalendar({setToday,today}:Props) {
  const [value, onChange] = useState<Value>(today);
  console.log(value)
 
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const onClick = (add: number) => {
    console.log("clicked", add);
    const newDate = new Date (today);
    newDate.setDate(today.getDate()+add)
    setToday(newDate);
  }
      
  const day = today.getDate();
  const month = today.toLocaleString("en-US", { month: "long" });
  today.setHours(0, 0, 0, 0);

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
