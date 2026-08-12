import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { z } from "zod";
import { auth } from "../../../../auth";
import { Guide } from "../../../models/guide";
import { connectToDatabase } from "../../../serverActions/mongoose-connector";

/**
 * One exercise task as submitted by the editor.
 *
 * Two deliberate choices here:
 *
 * `_id` is accepted and round-tripped. Tasks are subdocuments with their own
 * ids, and stored ExerciseAttempts key their answers by that id. Dropping it
 * made mongoose mint a fresh id on every save, which silently detached every
 * past attempt from its question and reset the per-question analytics.
 *
 * `type` is an open string and unknown keys are preserved, because short-answer
 * and code tasks are authored by hand in the database (see
 * docs/exercise-engine-tasks.md). A teacher saving an unrelated edit through
 * this route must hand those tasks back unchanged rather than flattening them
 * into broken quiz questions. Quiz requirements are enforced for quiz tasks only.
 */
const exerciseTaskSchema = z
  .object({
    _id: z.string().optional(),
    type: z.string().trim().min(1).optional().default("quiz"),
    prompt: z.string().trim().min(1),
    points: z.number().int().min(1).optional().default(1),
    explanation: z.string().optional(),
    hint: z.string().optional(),
    goal: z.string().optional(),
    // Quiz-only; required by the refinement below when type === "quiz".
    options: z.array(z.string()).min(2).optional(),
    correctAnswers: z.array(z.number().int().min(0)).min(1).optional(),
    allowMultiple: z.boolean().optional(),
  })
  .passthrough()
  .superRefine((task, ctx) => {
    if (task.type !== "quiz") return;
    if (!task.options || task.options.length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["options"],
        message: "A quiz question needs at least two options",
      });
    }
    if (!task.correctAnswers || task.correctAnswers.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["correctAnswers"],
        message: "A quiz question needs at least one correct answer",
      });
    }
  });

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
      // How many of each type to serve per visit. Validated per type below:
      // a pool must be smaller than the number of tasks of THAT type.
      poolSizes: z
        .object({
          quiz: z.number().int().min(1).optional(),
          shortAnswer: z.number().int().min(1).optional(),
          code: z.number().int().min(1).optional(),
        })
        .optional(),
      tasks: z.array(exerciseTaskSchema),
    })
    .superRefine((ex, ctx) => {
      for (const [type, size] of Object.entries(ex.poolSizes ?? {})) {
        if (size === undefined) continue;
        const available = ex.tasks.filter(
          (t) => (t.type ?? "quiz") === type
        ).length;
        if (size >= available) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["poolSizes", type],
            message: `The ${type} pool must be smaller than the ${available} ${type} task(s) available`,
          });
        }
      }
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
