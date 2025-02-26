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


const Sidebar = () => {
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
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "20px", paddingTop: "40px" }}>
            {/* {iconlist.map(( icon:any, index ) => <Link href={icon.link} key={index}> 
            <ImageIcon link={icon.link} pathname={pathname}  src={icon.icon} alt="icon"></ImageIcon> 
            </Link> )} */}
            <ImageIcon src={home} alt="home" /> 
            <ImageIcon src={guides} alt="guides"  /> 
            <ImageIcon src={calendar} alt="calendar"  /> 
            <ImageIcon src={people} alt="people"  /> 
            <ImageIcon src={resources} alt="resources"  />
            <ImageIcon src={email} alt="email"  />  
            <ArrowIcon src={arrow} alt="Arrow" width={24} height={24} />
            
        </div>
    )
}

export default Sidebar