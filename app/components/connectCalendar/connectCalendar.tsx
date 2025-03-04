"use client"

import DailyPlan from "components/dailyPlan/DailyPlan"
import WidgetCalendar from "components/widgetCalendar/widgetCalendar"
import { LayoutPlanCal } from "pages/style"
import { useState } from "react"
import { Event as CalendarEvent } from "react-big-calendar";

interface Event extends CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  color: string;
}

const ConnectCalendar = ()=>{
    const [today, setToday]= useState(new Date());
    return (
        <LayoutPlanCal>
            <DailyPlan today={today} setToday={setToday} />
            <WidgetCalendar today={today} setToday={setToday} />
        </LayoutPlanCal>
    )
}

export default ConnectCalendar 
