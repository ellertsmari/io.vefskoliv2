"use server";
import { Types } from "mongoose";
import { connectToDatabase } from "./mongoose-connector";
import { Event } from "models/event";
import { EventType } from "models/event";
import {
    type Event as CalendarEvent,
   
  } from "react-big-calendar";


interface EvenType extends CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  color: string;
}

export const getEvents = async () => {
  await connectToDatabase();
  const events: EventType[] | null = (await Event.find()) || null;
  return JSON.parse(JSON.stringify(events));

};

export const addEvent = async (event: EventType) => {
  await connectToDatabase();
  (await Event.insertOne(event)) || null;
  return event;
};




export const updateEvent = async (event : EvenType) => {
    await connectToDatabase();
    (await Event.updateOne({id:event.id}, event)) || null;
    return event;
  };
  


