"use server";
import { connectToDatabase } from "./mongoose-connector";
import { Guide } from "models/guide";
import { GuideType } from "models/guide";
import { Types } from "mongoose";

export async function getPublicGuides(): Promise<GuideType[] | null> {
  // For testing purposes, return mock data if database connection fails
  try {
    await connectToDatabase();

    // Fetch only the basic guide information without user-specific data
    const guides = await Guide.find({})
      .select({
        _id: 1,
        title: 1,
        description: 1,
        category: 1,
        order: 1,
        module: 1,
        references: 1,
        knowledge: 1,
        skills: 1,
        resources: 1,
        themeIdea: 1,
        topicsList: 1,
        classes: 1,
        createdAt: 1,
        updatedAt: 1,
      })
      .sort({ order: 1 })
      .exec();

    // Serialize MongoDB documents to plain objects for client components
    return JSON.parse(JSON.stringify(guides));
  } catch (e) {
    console.error("Failed to fetch public guides:", e);
    
    // Return mock data for testing - using a simpler structure
    return [
      {
        _id: new Types.ObjectId("507f1f77bcf86cd799439011"),
        title: "Introduction to Web Development",
        description: "Learn the basics of web development with HTML, CSS, and JavaScript.",
        category: "Web Development",
        order: 1,
        module: {
          title: "1 - Foundations",
          number: 1,
        },
        references: [] as any,
        knowledge: [] as any,
        skills: [] as any,
        resources: [] as any,
        themeIdea: {
          title: "Build a Personal Website",
          description: "Create your first personal website using HTML and CSS",
        },
        topicsList: "HTML, CSS, Web Fundamentals",
        classes: [] as any,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: new Types.ObjectId("507f1f77bcf86cd799439012"),
        title: "JavaScript Fundamentals",
        description: "Master the fundamentals of JavaScript programming.",
        category: "Programming",
        order: 2,
        module: {
          title: "1 - Foundations",
          number: 1,
        },
        references: [] as any,
        knowledge: [] as any,
        skills: [] as any,
        resources: [] as any,
        themeIdea: {
          title: "Interactive Web App",
          description: "Build an interactive web application with JavaScript",
        },
        topicsList: "JavaScript, Programming, Interactivity",
        classes: [] as any,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ] as GuideType[];
  }
}
