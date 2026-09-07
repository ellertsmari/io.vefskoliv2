"use server";
import { connectToDatabase } from "./mongoose-connector";
import { Guide } from "models/guide";
import { GuideType } from "models/guide";

export async function getPublicGuides(): Promise<GuideType[] | null> {
  try {
    await connectToDatabase();

    // Fetch only the basic guide information without user-specific data
    const guides = await Guide.find({})
      .select({
        _id: 1,
        title: 1,
        description: 1,
        category: 1,
        discipline: 1,
        isSpecialty: 1,
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
    // Null, not a stand-in list: a visitor during an outage used to be shown
    // two invented guides, which read as the real course.
    console.error("Failed to fetch public guides:", e);
    return null;
  }
}
