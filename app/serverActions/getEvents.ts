"use server";
import { connectToDatabase } from "./mongoose-connector";
import { Event } from "models/event";
import { EventType } from "models/event";
import {
    type Event as CalendarEvent,
   
  } from "react-big-calendar";


interface Event extends CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  color: string;
  owner: string;
  createdAt: NativeDate;
  updatedAt: NativeDate;


  
}



export const getEvents = async () => {
  await connectToDatabase();
  const events: EventType[] | null = (await Event.find()) || null;
  return JSON.parse(JSON.stringify(events));

};

export const addEvent = async (event: Event) => {
  await connectToDatabase();
  (await Event.insertOne(event)) || null;

  return event;
};




export const updateEvent = async (event : Event) => {
    await connectToDatabase();
    (await Event.updateOne({id:event.id}, event)) || null;
    return event;
  };
  


  export const delEvent = async (event : Event) => {
    await connectToDatabase();
    (await Event.deleteOne({id:event.id}, event)) || null;
    return event;
  };
  




