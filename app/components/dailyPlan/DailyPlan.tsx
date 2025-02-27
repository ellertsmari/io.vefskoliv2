"use client"
import React, { MouseEventHandler, useEffect, useState } from "react";
import { getEvents } from "serverActions/getEvents";
import { Event as CalendarEvent } from "react-big-calendar";
import {
  DayWrapper,
  PlanWrapper,
  Wrapper,
  Header,
  MainFrame,
  NavigationContainer,
  EventsContainer,
  TitleParagraph,
 Time,
 Title,

} from "./style";
import { CircleArrowLeft, CircleArrowRight } from "lucide-react";
import { Event } from "models/event";

interface Event extends CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  color: string;
}

const DailyPlan = () => {
  const [events, setEvents] = useState<Event[]>([]);

const [today, setToday]= useState(new Date());

  const day = today.getDate();
  const month = today.toLocaleString("en-US", { month: "long" });
  today.setHours(0, 0, 0, 0);

  useEffect(() => {
    const getSchedule = async () => {
      const dbEvents = (await getEvents()) as Event[];

      const filteredEvents = dbEvents.filter((event) => {
        const eventDate = new Date(event.start);
        eventDate.setHours(0, 0, 0, 0);
        return eventDate.getTime() === today.getTime();
      });

      setEvents(filteredEvents);
    };

    getSchedule();
  }, [today]);

  const onClick = (add: number) => {
    console.log("clicked", add);
    const newDate = new Date (today);
    newDate.setDate(today.getDate()+add)
    setToday(newDate);

  }



  return (
    <MainFrame className="daily-plan">
      <Title>Daily Plan</Title>
      <Wrapper>
        <Header>
          <NavigationContainer onClick={()=>onClick(-1)}>
            <CircleArrowLeft size={24}  />
          </NavigationContainer>
          <DayWrapper>
            <span> {day}</span>
            <span> {month}</span>
          </DayWrapper>
          <NavigationContainer onClick={()=>onClick(1)}>
            <CircleArrowRight size={24} />
          </NavigationContainer>
        </Header>
        <EventsContainer
          style={{ display: "flex", gap: 16, flexDirection: "column" }}
          className="events"
        >
          {events.map((event) => (
            <PlanWrapper key={event.id}>
              <TitleParagraph>{event.title}</TitleParagraph>
              <Time>{new Date(event.start).toLocaleTimeString()}</Time>
            </PlanWrapper>
          ))}
        </EventsContainer>
      </Wrapper>
    </MainFrame>
  );
};

export default DailyPlan;
