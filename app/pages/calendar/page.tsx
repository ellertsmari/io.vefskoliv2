'use server'

import { Session } from "@auth/core/types";
import { auth } from "auth";
import CalendarScheduler from "components/calendar/Calendar";
import { UserType } from "models/user";



const Calendar = async () =>  {


  const session = await auth() as  Session
    console.log(session)

  return (
      <CalendarScheduler role={session?.user?.role}  />
  );
};

export default Calendar;
