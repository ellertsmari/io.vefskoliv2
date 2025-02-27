"use client";

import { useState } from "react";
import "react-calendar/dist/Calendar.css";
import {
  StyledCalendar,
  Headline,
  EventListContainer,
  EventColumn,
  EventDay,
  EventDate,
  EventContent,
  EventIcon,
  ContainerFrame,
  EventWrapper,
} from "./calendarStyle";
import Image from "next/image";
import Bell from "/public/Icon.svg";

type ValuePiece = Date | null;

type Value = ValuePiece | [ValuePiece, ValuePiece];

const CalendarComponent = () => {
  const [value, onChange] = useState<Value>(new Date());

  console.log(value);

  const events = [
    {
      day: "Fri",
      date: "7.",
      content: "10:00 React Native  Lecture",
      image: Bell,
    },
    {
      day: "Tue",
      date: "11.",
      content: "10:00  Atomic Design Lecture",
      image: Bell,
    },
    {
      day: "Sat",
      date: "15.",
      content: "12:00  Weekend Pizza",
      image: Bell,
    },
  ];

  return (
    <ContainerFrame>
      <StyledCalendar onChange={onChange} value={value} />
      <EventWrapper>
        <Headline>Events</Headline>
        {events.map((event, index) => {
          return (
            <EventListContainer key={index}>
              <EventColumn>
                <EventDay>{event.day}</EventDay>
                <EventDate>{event.date}</EventDate>
                <div
                  style={{ borderLeft: "1px solid #C4ABB0", height: "30px" }}
                ></div>
                <EventContent>{event.content}</EventContent>
              </EventColumn>
              <EventIcon>
                {" "}
                <Image
                  src={event.image}
                  alt="icon"
                  width="24"
                  height="24"
                />{" "}
              </EventIcon>
            </EventListContainer>
          );
        })}
      </EventWrapper>
    </ContainerFrame>
  );
};

export default CalendarComponent;
