"use client";
import type React from "react";

import { useState, useRef, useEffect } from "react";
import {
  addEvent,
  updateEvent,
  getEvents,
  delEvent,
} from "serverActions/getEvents";
// import { EventType } from "../../models/event";
import {
  Calendar,
  momentLocalizer,
  type SlotInfo,
  type Event as CalendarEvent,
  type View,
} from "react-big-calendar";
import moment from "moment";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import { CircleArrowLeft, CircleArrowRight, CirclePlus } from "lucide-react";
import {
  Container,
  Title,
  CalendarContainer,
  Button,
  Overlay,
  Dialog,
  DialogTitle,
  Form,
  FormGroup,
  Label,
  Input,
  Select,
  DeleteButton,
  NavigationContainer,
  NavigationButton,
  LeftNav,
  ViewToggle,
  Legend,
  LegendItem,
  LegendColor,
  ViewToggleButton,
  MainContainer,
} from "./style";

import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";


const localizer = momentLocalizer(moment);

const DnDCalendar = withDragAndDrop<Event, object>(Calendar as any);

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

type CalendarProps = React.ComponentProps<typeof Calendar<Event, object>>;

const eventTypes = [
  { name: "Guides", color: "#007ac2" },
  { name: "Lecture", color: "#485c35" },
  { name: "Viso", color: "#edb400" },
  { name: "Group project", color: "#B53A3A" },
  { name: "One on one interview", color: "#1b998b" },
  { name: "Extra", color: "#807FD9" },
];

const CustomToolbar: React.FC<any> = (toolbar) => {
  const goToBack = () => {
    toolbar.onNavigate("PREV");
  };

  const goToNext = () => {
    toolbar.onNavigate("NEXT");
  };

  const label = () => {
    const date = toolbar.date;
    if (toolbar.view === "month") {
      return moment(date).format("MMMM YYYY");
    }
    if (toolbar.view === "week") {
      const start = moment(date).startOf("week").format("MMM D");
      const end = moment(date).endOf("week").format("MMM D, YYYY");
      return `${start} - ${end}`;
    }
    if (toolbar.view === "day") {
      return moment(date).format("dddd, MMMM D, YYYY");
    }
    return "";
  };

  return (
    <NavigationContainer>
      <LeftNav>
        <NavigationButton onClick={goToBack}>
          <CircleArrowLeft />
        </NavigationButton>
        <span style={{ margin: "0 10px" }}>{label()}</span>
        <NavigationButton onClick={goToNext}>
          <CircleArrowRight />
        </NavigationButton>
      </LeftNav>

      <ViewToggle >
        <Button
          onClick={toolbar.onAddEvent}
          style={{ backgroundColor: "transparent", padding: '0px 12px' }}
        >
          <CirclePlus color="#2B5B76" />
        </Button>
        <ViewToggleButton
          onClick={() => toolbar.onView("month")}
          $active={toolbar.view === "month"}
        >
          Month
        </ViewToggleButton>
        <ViewToggleButton
          onClick={() => toolbar.onView("week")}
          $active={toolbar.view === "week"}
        >
          Week
        </ViewToggleButton>
      </ViewToggle>
    </NavigationContainer>
  );
};

type Props = {
  role: string;
  userid: string;
};

const CalendarScheduler = ({ role, userid }: Props) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDate, setNewEventDate] = useState("");
  const [newEventDateEnd, setNewEventDateEnd] = useState("");

  const [newEventStart, setNewEventStart] = useState("");
  const [newEventEnd, setNewEventEnd] = useState("");
  const [newEventType, setNewEventType] = useState(eventTypes[0].name);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<View>("month");

  useEffect(() => {
    const getSchedule = async () => {
      const dbEvents = (await getEvents()) as Event[];
      setEvents([...dbEvents]);
    };
    getSchedule();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dialogRef.current &&
        !dialogRef.current.contains(event.target as Node)
      ) {
        setIsDialogOpen(false);
      }
    };

    if (isDialogOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDialogOpen]);

  const addOrUpdateEvent = () => {
    if (
      newEventTitle &&
      newEventDate &&
      newEventDateEnd &&
      newEventStart &&
      newEventEnd
    ) {
      const eventData: Event = {
        id: editingEvent
          ? editingEvent.id
          : Math.random().toString(36).substr(2, 9),
        title: newEventTitle,
        start: new Date(`${newEventDate} ${newEventStart}`),
        end: new Date(`${newEventDateEnd} ${newEventEnd}`),
        color:
          eventTypes.find((type) => type.name === newEventType)?.color ||
          eventTypes[0].color,

        owner: userid,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      console.log(userid);

      if (editingEvent) {
        setEvents(
          events.map((e) => (e.id === editingEvent.id ? eventData : e))
        );
        updateEvent(eventData);
      } else {
        setEvents([...events, eventData]);

        addEvent(eventData);
      }

      setNewEventTitle("");
      setNewEventDate("");
      setNewEventDateEnd("");
      setNewEventStart("");
      setNewEventEnd("");
      setNewEventType(eventTypes[0].name);
      setIsDialogOpen(false);
      setEditingEvent(null);
    }
  };

  const moveEvent = ({
    event,
    start,
    end,
  }: {
    event: Event;
    start: Date;
    end: Date;
  }) => {
    const idx = events.indexOf(event);
    const updatedEvent = { ...event, start, end };

    const nextEvents = [...events];
    nextEvents.splice(idx, 1, updatedEvent);

    if (role !== "admin" && userid !== event.owner) {
      alert("You do not have permission to change this event.");
      return;
    }

    setEvents(nextEvents);
    updateEvent(updatedEvent);
  };

  const resizeEvent = ({
    event,
    start,
    end,
  }: {
    event: Event;
    start: Date;
    end: Date;
  }) => {
    const idx = events.indexOf(event);
    const updatedEvent = { ...event, start, end };

    const nextEvents = [...events];
    nextEvents.splice(idx, 1, updatedEvent);

    if (role !== "admin" && userid !== event.owner) {
      alert("You do not have permission to change this event.");
      return;
    }

    setEvents(nextEvents);
    updateEvent(updatedEvent);
  };

  const handleSelectEvent = (event: Event) => {
    setEditingEvent(event);
    setNewEventTitle(event.title);
    setNewEventDate(moment(event.start).format("YYYY-MM-DD"));
    setNewEventDateEnd(moment(event.start).format("YYYY-MM-DD"));

    setNewEventStart(moment(event.start).format("HH:mm"));
    setNewEventEnd(moment(event.end).format("HH:mm"));
    setNewEventType(
      eventTypes.find((type) => type.color === event.color)?.name ||
        eventTypes[0].name
    );
    setIsDialogOpen(true);
  };

  const handleSelectSlot = (slotInfo: SlotInfo) => {
    setNewEventDate(moment(slotInfo.start).format("YYYY-MM-DD"));
    setNewEventDateEnd(moment(slotInfo.start).format("YYYY-MM-DD"));

    setNewEventStart(moment(slotInfo.start).format("HH:mm"));
    setNewEventEnd(moment(slotInfo.end).format("HH:mm"));
    setEditingEvent(null);
    setIsDialogOpen(true);
  };

  const deleteEvent = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (editingEvent) {
      if (role !== "admin" && userid !== editingEvent.owner) {
        alert("You do not have permission to delete this event.");

        return;
      }
      const updatedEvents = events.filter((e) => e.id !== editingEvent.id);
      setEvents(updatedEvents);
      setEditingEvent(null);
      setIsDialogOpen(false);
      delEvent(editingEvent);
    }
  };

  const eventStyleGetter: CalendarProps["eventPropGetter"] = (event) => {
    const typedEvent = event as Event;
    return {
      style: {
        backgroundColor: typedEvent.color,
      },
    };
  };

  return (
    <MainContainer>
    <Container>
      <Title> Schedule</Title>
      <CalendarContainer>
        <DnDCalendar
          localizer={localizer}
          events={events}
          startAccessor={(event: Event) => new Date(event.start)}
          endAccessor={(event: Event) => new Date(event.end)}
          onEventDrop={({ event, start, end }) =>
            moveEvent({
              event: event as Event,
              start: new Date(start),
              end: new Date(end),
            })
          }
          onEventResize={({ event, start, end }) =>
            resizeEvent({
              event: event as Event,
              start: new Date(start),
              end: new Date(end),
            })
          }
          resizable
          selectable
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          eventPropGetter={eventStyleGetter}
          min={new Date(0, 0, 0, 8, 0, 0)}
          max={new Date(0, 0, 0, 19, 0, 0)}
          view={view}
          onView={(newView: View) => setView(newView)}
          formats={{
            timeGutterFormat: "HH:mm",
          }}
          components={{
            toolbar: (props) => (
              <CustomToolbar
                {...props}
                onAddEvent={() => setIsDialogOpen(true)}
              />
            ),
          }}
        />
      </CalendarContainer>
      {isDialogOpen && (
        <Overlay onClick={() => setIsDialogOpen(false)}>
          <Dialog ref={dialogRef} onClick={(e) => e.stopPropagation()}>
            <DialogTitle>
              {editingEvent ? "Edit Event" : "Add New Event"}
            </DialogTitle>
            <Form
              onSubmit={(e) => {
                e.preventDefault();
                addOrUpdateEvent();
              }}
            >
              <FormGroup>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                />
              </FormGroup>
              <FormGroup>
                <Label htmlFor="date">Start Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={newEventDate}
                  onChange={(e) => setNewEventDate(e.target.value)}
                />
              </FormGroup>
              <FormGroup>
                <Label htmlFor="date">End Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={newEventDateEnd}
                  onChange={(e) => setNewEventDateEnd(e.target.value)}
                />
              </FormGroup>

              <FormGroup>
                <Label htmlFor="start">Start Time</Label>
                <Select
                  id="start"
                  value={newEventStart}
                  onChange={(e) => setNewEventStart(e.target.value)}
                >
                  {Array.from({ length: 26 }, (_, i) => i + 14).map(
                    (halfHour) => {
                      const hour = Math.floor(halfHour / 2);
                      const minute = halfHour % 2 === 0 ? "00" : "30";
                      return (
                        <option
                          key={halfHour}
                          value={`${hour
                            .toString()
                            .padStart(2, "0")}:${minute}`}
                        >
                          {`${hour}:${minute}`}
                        </option>
                      );
                    }
                  )}
                </Select>
              </FormGroup>
              <FormGroup>
                <Label htmlFor="end">End Time</Label>
                <Select
                  id="end"
                  value={newEventEnd}
                  onChange={(e) => setNewEventEnd(e.target.value)}
                >
                  {Array.from({ length: 26 }, (_, i) => i + 14).map(
                    (halfHour) => {
                      const hour = Math.floor(halfHour / 2);
                      const minute = halfHour % 2 === 0 ? "00" : "30";
                      return (
                        <option
                          key={halfHour}
                          value={`${hour
                            .toString()
                            .padStart(2, "0")}:${minute}`}
                        >
                          {`${hour}:${minute}`}
                        </option>
                      );
                    }
                  )}
                </Select>
              </FormGroup>
              <FormGroup>
                <Label htmlFor="type">Event Type</Label>
                <Select
                  id="type"
                  value={newEventType}
                  onChange={(e) => setNewEventType(e.target.value)}
                >
                  {eventTypes.map((type) => (
                    <option key={type.name} value={type.name}>
                      {type.name}
                    </option>
                  ))}
                </Select>
              </FormGroup>
              <Button type="submit">
                {editingEvent ? "Update Event" : "Add Event"}
              </Button>
              {editingEvent && (
                <DeleteButton onClick={(e) => deleteEvent(e)}>
                  Delete Event
                </DeleteButton>
              )}
            </Form>
          </Dialog>
        </Overlay>
      )}
      {events.length > 0 && (
        <Legend>
          {eventTypes.map((type) => (
            <LegendItem key={type.name}>
              <LegendColor color={type.color} />
              <span>{type.name}</span>
            </LegendItem>
          ))}
        </Legend>
      )}
    </Container>
    </MainContainer>
  );
};

export default CalendarScheduler;
