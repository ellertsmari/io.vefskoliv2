"use client";

import styled from "styled-components";
import Calendar from "react-calendar";

// Styled Calendar component
export const CalendarComponent = styled(Calendar)`
  /* Ensure the whole calendar has a white background */
  background-color: white;
  border: 1px solid #e8f1fc;
  border-radius: 8px;
  padding: 20px;
  width: 307px;
  height: 240px;
  display: flex;
  flex-direction: column;
  margin-bottom: 14px;

  .react-calendar__month-view__days,
  .react-calendar__tile,
  .react-calendar__month-view__days__day,
  .react-calendar__month-view__days__day--neighboringMonth,
  abbr,
  button {
    border: none;
    font-size: 12px;
    margin: 0px auto;
    padding: 0px;
  }

  .react-calendar__month-view__weekdays__weekday,
  .react-calendar__month-view__weekdays__weekday--weekend {
    text-align: center;
  }

  .react-calendar__month-view__days,
  .react-calendar__tile,
  .react-calendar__month-view__days__day,
  .react-calendar__month-view__days__day--neighboringMonth,
  abbr,
  button {
    border: none;
    font-size: 12px;
    margin: 0px auto;
    padding: 0px;
  }

  .react-calendar__month-view__weekdays__weekday,
  .react-calendar__month-view__weekdays__weekday--weekend {
    text-align: center;
  }

  /* Style the navigation buttons (arrows) */
  .react-calendar__navigation__prev2-button,
  .react-calendar__navigation__next2-button,
  .react-calendar__navigation__prev-button,
  .react-calendar__navigation__next-button {
    background: white;
    border: 2px solid var(--main-Color);
    border-radius: 100px;
    width: 30px; /* Smaller width for the arrows */
    height: 25px; /* Smaller height for the arrows */
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease-in-out;
  }

  .react-calendar__navigation__arrow {
    color: var(--main-Color);
    font-size: 25px;
  }

  /* Hide the second set of arrows (prev2 and next2) */
  .react-calendar__navigation__prev2-button,
  .react-calendar__navigation__next2-button {
    display: none;
  }

  /* Style for the month title */
  .react-calendar__navigation__label {
    font-size: 20px;
    font-weight: bold;
    color: #2b5b76; /* Color for the month title */
    text-transform: capitalize;
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    border: none;
    background-color: white;
    padding: 0px 20px;
  }

  /* Container for the month title and arrows */
  .react-calendar__navigation {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    width: 100%;
  }

  /* Color for the days of the neighboring months */
  .react-calendar__month-view__days__day--neighboringMonth {
    color: #b3b3b3; /* Color for neighboring month days (January and March) */
    font-size: 11px;
  }

  .react-calendar__month-view__days__day.react-calendar__tile--active {
    background-color: var(--main-Lightblue);
    color: #2b5b76;
  }

  .react-calendar__month-view__days__day.react-calendar__tile--active {
    border: 4px solid var(--main-Lightblue);
    border-radius: 8px;
  }

  /* Styling the weekday names */
  .react-calendar__month-view__weekdays__weekday {
    font-size: 11px; /* Set day of week size to 11px */
    font-weight: bold;
    color: #2b5b76; /* Color for the weekdays */
  }

  /* Styling the individual day tiles */
  .react-calendar__month-view__days__day {
    font-size: 11px; /* Set day number size to 11px */
    font-weight: normal;
    color: var(--main-Color);
    padding: 8px;
    cursor: pointer;
    transition: background-color 0.2s ease-in-out;
    background-color: white;

    &:hover {
      background-color: var(--main-Lightblue);
      border-radius: 4px;
    }

    &.react-calendar__tile--active {
      background-color: transparent;
      color: #2b5b76;
    }
  }
`;

// Styled container for the calendar component
export const ContainerCalendar = styled.div`
  background: white;
  padding: 20px;
  border-radius: 8px;
  width: 300px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

export const Header = styled.div``;

export const Month = styled.div``;
export const WeekDays = styled.div``;

export const Days = styled.div``;
export const Day = styled.div;

export const ContainerMain = styled.div`
  gap: 21px;
  display: flex;
  flex-direction: column;
`;

export const Title = styled.div`
  font-size: 16px;
  color: var(--main-Color);
`;
