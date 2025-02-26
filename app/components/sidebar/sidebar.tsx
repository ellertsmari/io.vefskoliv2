'use client';

import styled from "styled-components";
import Image from "next/image";

import home from "../../../public/home2.svg"
import guides from "../../../public/guides.svg";
import calendar from "../../../public/calendar.svg";
import people from "../../../public/people.svg";
import resources from "../../../public/resources.svg";
import email from "../../../public/email.svg";
import Link from "next/link";
import { ImageIcon, ArrowIcon } from "./style";
import { usePathname } from "next/navigation";
import arrow from "../../../public/arrow.svg";
import { useState } from "react";

import homewhite from "../sidebar/icons/redIcons/homehover.svg"
import guideswhite from "../sidebar/icons/redIcons/guideshover.svg"
import calendarwhite from "../sidebar/icons/redIcons/calendarhover.svg"
import peoplewhite from "../sidebar/icons/redIcons/peoplehover.svg"
import resourceswhite from "../sidebar/icons/redIcons/resourceshover.svg"
import emailwhite from "../sidebar/icons/redIcons/emailhover.svg"


const Sidebar = () => {
    const [openModal, setOpenModal] = useState(false)
    const pathname = usePathname()
    const iconlist = [
        {
            icon: "../../../public/Vector.svg",
            link: "/"
        }, 
        {
            icon: guides,
            link: "/guides"
        }, {
            icon: calendar,
            link: "/calendar"
        }, {
            icon: people,
            link: "/people"
        }, {
            icon: resources,
            link: "/resources"
        }, {
            icon: email,
            link: "/email"
        }, 
    ]
    return (
        <>
        {!openModal ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "20px", paddingTop: "40px" }}>

            <ImageIcon src={home} alt="home" /> 
            <ImageIcon src={guides} alt="guides"  /> 
            <ImageIcon src={calendar} alt="calendar"  /> 
            <ImageIcon src={people} alt="people"  /> 
            <ImageIcon src={resources} alt="resources"  />
            <ImageIcon src={email} alt="email"  />  
            <button onClick={() => setOpenModal(true)}>
            <ArrowIcon src={arrow} alt="Arrow" width={24} height={24} />
            </button>
            
            </div>
        ) : (
            <div>
                <button onClick={() => setOpenModal(false)}>Go back</button>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "20px", paddingTop: "40px" }}></div>

                <Image src={homewhite} alt="home"/>
                <Image src={guideswhite} alt="guides"/>
                <Image src={calendarwhite} alt="calendar"/>
                <Image src={peoplewhite} alt="people"/>
                <Image src={resourceswhite} alt="resources"/>
                <Image src={emailwhite} alt="email"/>

            </div>
        )}
        </>
    )
}

export default Sidebar