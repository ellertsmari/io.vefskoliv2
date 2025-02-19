'use client'

const Groups = () => {
  return ( <div>
      <h1>Groups</h1>
  </div> );
}

export default Groups;


import React from "react";
import { Card } from "@/components/ui/card";



































const groups = [
  {
    id: 1,
    name: "Module 7 - group project",
    avatars: ["/avatars/1.jpg", "/avatars/2.jpg", "/avatars/3.jpg", "/avatars/4.jpg"],
  },
  {
    id: 2,
    name: "Module 2 - group project",
    avatars: ["/avatars/5.jpg", "/avatars/6.jpg", "/avatars/7.jpg", "/avatars/8.jpg"],
  },
  {
    id: 3,
    name: "Group 3 - design thinking",
    avatars: ["/avatars/9.jpg", "/avatars/10.jpg", "/avatars/11.jpg", "/avatars/12.jpg"],
  },
  {
    id: 4,
    name: "Group 4 - react native project",
    avatars: ["/avatars/13.jpg", "/avatars/14.jpg", "/avatars/15.jpg", "/avatars/16.jpg"],
  },
];

const GroupsList: React.FC = () => {
  return (
    <Card className="p-6 rounded-2xl shadow-md bg-white max-w-md">
      <h2 className="text-xl font-bold mb-4">Groups</h2>
      <ul className="space-y-3">
        {groups.map((group) => (
          <li key={group.id} className="flex items-center space-x-3">
            <div className="flex -space-x-2 overflow-hidden">
              {group.avatars.map((avatar, index) => (
                <img
                  key={index}
                  src={avatar}
                  alt="avatar"
                  className="w-8 h-8 rounded-full border-2 border-white"
                />
              ))}
            </div>
            <span className="text-sm font-medium text-gray-700">{group.name}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
};

export default GroupsList;
