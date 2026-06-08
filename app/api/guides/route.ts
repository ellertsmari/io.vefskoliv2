import { NextResponse } from "next/server";
import { auth } from "../../../auth";
import { Guide } from "../../models/guide";
import { connectToDatabase } from "../../serverActions/mongoose-connector";

/**
 * Create a new guide.
 *
 * The guide schema has many required fields, so rather than persisting an empty
 * document we create a valid draft with placeholder values and return its id.
 * The client then redirects into the existing edit form to fill it in. This lets
 * "Create New Guide" reuse the entire EditGuideForm (including exercise authoring)
 * instead of duplicating it.
 */
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    // Place the new guide at the end of the list.
    const last = (await Guide.findOne()
      .sort({ order: -1 })
      .select("order")
      .lean()) as unknown as { order?: number } | null;
    const nextOrder =
      last && typeof last.order === "number" ? last.order + 1 : 0;

    const now = new Date();
    const draft = await Guide.create({
      title: "Untitled guide",
      description: "TODO: add a description",
      category: "code",
      topicsList: "TODO",
      order: nextOrder,
      themeIdea: { title: "Project", description: "TODO: add the task" },
      module: { title: "0 - Preparation", number: 0 },
      knowledge: [],
      skills: [],
      resources: [],
      references: [],
      classes: [],
      gradingMode: "peerReview",
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({ id: draft._id.toString() }, { status: 201 });
  } catch (error) {
    console.error("Error creating guide:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
