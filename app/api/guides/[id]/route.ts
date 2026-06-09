import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { z } from "zod";
import { auth } from "../../../../auth";
import { Guide } from "../../../models/guide";
import { connectToDatabase } from "../../../serverActions/mongoose-connector";

/**
 * Whitelist of fields a teacher may update through the edit form. The previous
 * implementation spread the raw request body into findByIdAndUpdate, which let
 * a client write arbitrary keys (mass assignment). This schema mirrors what
 * EditGuideForm sends; unknown keys are stripped by default.
 */
const GuideUpdateSchema = z.object({
  title: z.string().trim().min(1).optional(),
  description: z.string().optional(),
  topicsList: z.string().optional(),
  order: z.number().int().min(0).optional(),
  discipline: z.enum(["code", "design"]).optional(),
  isSpecialty: z.boolean().optional(),
  category: z.string().optional(),
  themeIdea: z
    .object({ title: z.string(), description: z.string() })
    .optional(),
  module: z.object({ title: z.string(), number: z.number().int() }).optional(),
  knowledge: z.array(z.object({ knowledge: z.string() })).optional(),
  skills: z.array(z.object({ skill: z.string() })).optional(),
  resources: z
    .array(z.object({ link: z.string(), description: z.string() }))
    .optional(),
  references: z
    .array(z.object({ type: z.string(), name: z.string(), link: z.string() }))
    .optional(),
  classes: z
    .array(z.object({ title: z.string(), link: z.string() }))
    .optional(),
  gradingMode: z.enum(["peerReview", "auto"]).optional(),
  // null clears a previously authored exercise (peer-review guides).
  exercise: z
    .object({
      passThreshold: z.number().min(0).max(1),
      tasks: z.array(
        z.object({
          type: z.literal("quiz").optional().default("quiz"),
          prompt: z.string().trim().min(1),
          options: z.array(z.string()).min(2),
          correctAnswers: z.array(z.number().int().min(0)).min(1),
          allowMultiple: z.boolean().optional().default(false),
          points: z.number().int().min(1).optional().default(1),
          explanation: z.string().optional(),
          hint: z.string().optional(),
        })
      ),
    })
    .nullable()
    .optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.id || session.user.role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Guide not found" }, { status: 404 });
    }

    const body = await request.json();
    const validated = GuideUpdateSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validated.error.flatten() },
        { status: 400 }
      );
    }

    // Drop undefined keys so partial updates don't unset existing fields, and
    // translate `exercise: null` into an explicit $unset.
    const { exercise, ...rest } = validated.data;
    const updateFields = Object.fromEntries(
      Object.entries(rest).filter(([, v]) => v !== undefined)
    );

    const update: Record<string, unknown> = {
      ...updateFields,
      updatedAt: new Date(), // server-controlled; client value is ignored
    };
    if (exercise === null) {
      update.$unset = { exercise: 1 };
    } else if (exercise !== undefined) {
      update.exercise = exercise;
    }

    await connectToDatabase();

    const updatedGuide = await Guide.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    });

    if (!updatedGuide) {
      return NextResponse.json({ error: "Guide not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Guide updated successfully",
      guide: updatedGuide,
    });
  } catch (error) {
    // Log server-side; don't echo internals back to the client.
    console.error("Error updating guide:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.id || session.user.role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Guide not found" }, { status: 404 });
    }

    await connectToDatabase();

    const deletedGuide = await Guide.findByIdAndDelete(id);

    if (!deletedGuide) {
      return NextResponse.json({ error: "Guide not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Guide deleted successfully" });
  } catch (error) {
    console.error("Error deleting guide:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
