"use server";

import { Session } from "@auth/core/types";
import { auth } from "auth";
import CalendarScheduler from "components/calendar/Calendar";

const Calendar = async () => {
  const session = (await auth()) as Session;

  console.log(session);
  if (!session?.user?.role || !session?.user?.id) {
    return (
      <>
        <p>No Events</p>
      </>
    );
  }
  return (
    <CalendarScheduler
      role={session?.user?.role}
      userid={session?.user?.id}
    />
  );
};

export default Calendar;
