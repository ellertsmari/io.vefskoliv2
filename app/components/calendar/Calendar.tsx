"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Calendar, momentLocalizer, type SlotInfo, type Event as CalendarEvent, type View } from "react-big-calendar"
import moment from "moment"
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop"
import styled from "styled-components"
import { CircleArrowLeft, CircleArrowRight } from "lucide-react"

// Import styles
import "react-big-calendar/lib/css/react-big-calendar.css"
import "react-big-calendar/lib/addons/dragAndDrop/styles.css"

// Setup the localizer for react-big-calendar
const localizer = momentLocalizer(moment)

// Create a DnD Calendar
const DnDCalendar = withDragAndDrop<Event, object>(Calendar as any)

interface Event extends CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  color: string
}

type CalendarProps = React.ComponentProps<typeof Calendar<Event, object>>
type DnDCalendarProps = CalendarProps 

const eventTypes = [
  { name: "Module", color: "#2B5B76" },
  { name: "Lecture", color: "#EC9A4D" },
  { name: "Viso", color: "#E5D264" },
  { name: "Group project", color: "#C54C4C" },
  { name: "One on One", color: "#60A848" },
  { name: "Extra", color: "#9c27b0" },
]

const Container = styled.div`
  padding: 1rem;
`

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 1rem;
  color: #2B5B76;
`

const CalendarContainer = styled.div`
  height: 500px;
`

const Button = styled.button`
  background-color: #3174ad;
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 1rem;

  &:hover {
    background-color: #2a5885;
  }
`

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`

const Dialog = styled.div`
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  
`

const DialogTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: bold;
  margin-bottom: 1rem;
  color: #2B5B76;
  
`

const Form = styled.form`
  display: grid;
  gap: 1rem;
  
`

const FormGroup = styled.div`
  display: grid;
  grid-template-columns: 1fr 3fr;
  align-items: center;
  gap: 1rem;
  
  
`

const Label = styled.label`
  text-align: right;
  color: #2B5B76;

  
`

const Input = styled.input`
  padding: 0.5rem;
  border: 1px solid #2B5B76;
  border-radius: 4px;
  &:focus {
    outline: none;  
  }
`

const Select = styled.select`
  padding: 0.5rem;
  border: 1px solid #2B5B76;
  border-radius: 4px;
  background-color: transparent;
  &:focus {
    outline: none;  
  }
`




const DeleteButton = styled(Button)`
  background-color: #f44336;

  &:hover {
    background-color: #d32f2f;
  }
`

const NavigationContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  color: #2B5B76;
  align-content: center;
`

const NavigationButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.5rem;
  color: #2B5B76;`


const LeftNav = styled.div `
  
  display: flex;
  justify-content: center;
  align-items: center;

`

const ViewToggle = styled.div`
  display: flex;
  margin-left: 1rem;
`

const ViewToggleButton = styled.button<{ $active: boolean }>`
  background-color: ${(props) => (props.$active ? "#2B5B76" : "white")};
  color: ${(props) => (props.$active ? "white" : "#2B5B76")};
  border: 1px solid #3174ad;
  padding: 0.25rem 0.5rem;
  cursor: pointer;
  &:first-child {
    border-top-left-radius: 4px;
    border-bottom-left-radius: 4px;
  }
  &:last-child {
    border-top-right-radius: 4px;
    border-bottom-right-radius: 4px;
  }
`

const Legend = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 1rem;
`

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  margin: 0.5rem;
`

const LegendColor = styled.div<{ color: string }>`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: ${(props) => props.color};
  margin-right: 0.5rem;
`

const CustomToolbar: React.FC<any> = (toolbar) => {
  const goToBack = () => {
    toolbar.onNavigate("PREV")
  }

  const goToNext = () => {
    toolbar.onNavigate("NEXT")
  }

  const label = () => {
    const date = toolbar.date
    if (toolbar.view === "month") {
      return moment(date).format("MMMM YYYY")
    }
    if (toolbar.view === "week") {
      const start = moment(date).startOf("week").format("MMM D")
      const end = moment(date).endOf("week").format("MMM D, YYYY")
      return `${start} - ${end}`
    }
    if (toolbar.view === "day") {
      return moment(date).format("dddd, MMMM D, YYYY")
    }
    return ""
  }

  return (
    <NavigationContainer>
      <LeftNav>
        <NavigationButton onClick={goToBack}>
          <CircleArrowLeft />
        </NavigationButton>
        <span style={{ margin: "0 10px"}}>{label()}</span>
        <NavigationButton onClick={goToNext}>
          <CircleArrowRight />
        </NavigationButton>
      </LeftNav>
      <ViewToggle>
        <ViewToggleButton onClick={() => toolbar.onView("month")} $active={toolbar.view === "month" }>
          Month
        </ViewToggleButton>
        <ViewToggleButton onClick={() => toolbar.onView("week")} $active={toolbar.view === "week" }>
          Week
        </ViewToggleButton>
      </ViewToggle>
    </NavigationContainer>
  )
}

const CalendarScheduler: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([])
  const [newEventTitle, setNewEventTitle] = useState("")
  const [newEventDate, setNewEventDate] = useState("")
  const [newEventStart, setNewEventStart] = useState("")
  const [newEventEnd, setNewEventEnd] = useState("")
  const [newEventType, setNewEventType] = useState(eventTypes[0].name)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const [view, setView] = useState<View>("month")

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(event.target as Node)) {
        setIsDialogOpen(false)
      }
    }

    if (isDialogOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isDialogOpen])

  const addOrUpdateEvent = () => {
    if (newEventTitle && newEventDate && newEventStart && newEventEnd) {
      const eventData: Event = {
        id: editingEvent ? editingEvent.id : Math.random().toString(36).substr(2, 9),
        title: newEventTitle,
        start: new Date(`${newEventDate} ${newEventStart}`),
        end: new Date(`${newEventDate} ${newEventEnd}`),
        color: eventTypes.find((type) => type.name === newEventType)?.color || eventTypes[0].color,
      }

      if (editingEvent) {
        setEvents(events.map((e) => (e.id === editingEvent.id ? eventData : e)))
      } else {
        setEvents([...events, eventData])
      }

      setNewEventTitle("")
      setNewEventDate("")
      setNewEventStart("")
      setNewEventEnd("")
      setNewEventType(eventTypes[0].name)
      setIsDialogOpen(false)
      setEditingEvent(null)
    }
  }

  const moveEvent = ({ event, start, end }: { event: Event; start: Date; end: Date }) => {
    const idx = events.indexOf(event)
    const updatedEvent = { ...event, start, end }

    const nextEvents = [...events]
    nextEvents.splice(idx, 1, updatedEvent)

    setEvents(nextEvents)
  }

  const resizeEvent = ({ event, start, end }: { event: Event; start: Date; end: Date }) => {
    const idx = events.indexOf(event)
    const updatedEvent = { ...event, start, end }

    const nextEvents = [...events]
    nextEvents.splice(idx, 1, updatedEvent)

    setEvents(nextEvents)
  }

  const handleSelectEvent = (event: Event) => {
    setEditingEvent(event)
    setNewEventTitle(event.title)
    setNewEventDate(moment(event.start).format("YYYY-MM-DD"))
    setNewEventStart(moment(event.start).format("HH:mm"))
    setNewEventEnd(moment(event.end).format("HH:mm"))
    setNewEventType(eventTypes.find((type) => type.color === event.color)?.name || eventTypes[0].name)
    setIsDialogOpen(true)
  }

  const handleSelectSlot = (slotInfo: SlotInfo) => {
    setNewEventDate(moment(slotInfo.start).format("YYYY-MM-DD"))
    setNewEventStart(moment(slotInfo.start).format("HH:mm"))
    setNewEventEnd(moment(slotInfo.end).format("HH:mm"))
    setEditingEvent(null)
    setIsDialogOpen(true)
  }

  const deleteEvent = () => {
    if (editingEvent) {
      const updatedEvents = events.filter((e) => e.id !== editingEvent.id)
      setEvents(updatedEvents)
      setEditingEvent(null)
      setIsDialogOpen(false)
    }
  }

  const eventStyleGetter: CalendarProps["eventPropGetter"] = (event) => {
    const typedEvent = event as Event
    return {
      style: {
        backgroundColor: typedEvent.color,
      },
    }
  }

  return (
    <Container>
      <Title>Calendar Scheduler</Title>
      <CalendarContainer>
        <DnDCalendar
          localizer={localizer}
          events={events}
          startAccessor={(event: Event) => event.start}
          endAccessor={(event: Event) => event.end}
          onEventDrop={({ event, start, end }) => moveEvent({ event: event as Event, start:(new Date(start)), end:(new Date(end)) })}
          onEventResize={({ event, start, end }) => resizeEvent({ event: event as Event, start:(new Date(start)), end:(new Date(end)) })}
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
            timeGutterFormat: "HH:mm"}}
          components={{
            toolbar: CustomToolbar,
          }}
        />
      </CalendarContainer>
      <Button onClick={() => setIsDialogOpen(true)}>Add Event</Button>
      {isDialogOpen && (
        <Overlay onClick={() => setIsDialogOpen(false)}>
          <Dialog ref={dialogRef} onClick={(e) => e.stopPropagation()}>
            <DialogTitle>{editingEvent ? "Edit Event" : "Add New Event"}</DialogTitle>
            <Form
              onSubmit={(e) => {
                e.preventDefault()
                addOrUpdateEvent()
              }}
            >
              <FormGroup>
                <Label htmlFor="title">Title</Label>
                <Input id="title" value={newEventTitle} onChange={(e) => setNewEventTitle(e.target.value)} />
              </FormGroup>
              <FormGroup>
                <Label htmlFor="date">Date</Label>
                <Input id="date" type="date" value={newEventDate} onChange={(e) => setNewEventDate(e.target.value)} />
              </FormGroup>
              <FormGroup>
                <Label htmlFor="start">Start</Label>
                <Select id="start" value={newEventStart} onChange={(e) => setNewEventStart(e.target.value)}>
                  {Array.from({ length: 26 }, (_, i) => i + 14).map((halfHour) => {
                    const hour = Math.floor(halfHour / 2)
                    const minute = halfHour % 2 === 0 ? "00" : "30"
                    return (
                      <option key={halfHour} value={`${hour.toString().padStart(2, "0")}:${minute}`}>
                        {`${hour}:${minute}`}
                      </option>
                    )
                  })}
                </Select>
              </FormGroup>
              <FormGroup>
                <Label htmlFor="end">End</Label>
                <Select id="end" value={newEventEnd} onChange={(e) => setNewEventEnd(e.target.value)}>
                  {Array.from({ length: 26 }, (_, i) => i + 14).map((halfHour) => {
                    const hour = Math.floor(halfHour / 2)
                    const minute = halfHour % 2 === 0 ? "00" : "30"
                    return (
                      <option key={halfHour} value={`${hour.toString().padStart(2, "0")}:${minute}`}>
                        {`${hour}:${minute}`}
                      </option>
                    )
                  })}
                </Select>
              </FormGroup>
              <FormGroup>
                <Label htmlFor="type">Event Type</Label>
                <Select id="type" value={newEventType} onChange={(e) => setNewEventType(e.target.value)}>
                  {eventTypes.map((type) => (
                    <option key={type.name} value={type.name}>
                      {type.name}
                    </option>
                  ))}
                </Select>
              </FormGroup>
              <Button type="submit">{editingEvent ? "Update Event" : "Add Event"}</Button>
              {editingEvent && <DeleteButton onClick={deleteEvent}>Delete Event</DeleteButton>}
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
  )
}

export default CalendarScheduler

