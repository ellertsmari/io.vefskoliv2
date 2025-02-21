'use client'
import Calendar from 'react-calendar';
import {useState} from 'react';
import 'react-calendar/dist/Calendar.css';

type ValuePiece = Date | null;

type Value = ValuePiece | [ValuePiece, ValuePiece];


const CalendarComponent = ( ) => {
const [value, onChange] = useState<Value>(new Date());

console.log(value)

    return (
    <Calendar onChange={onChange} value={value}/>
    )
}

export default CalendarComponent


