import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { Guide } from "../../../models/guide";
import { connectToDatabase } from "../../../serverActions/mongoose-connector";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log("Starting PUT request for guide:", params.id);
    const session = await auth();
    console.log("Session:", session ? { userId: session.user?.id, role: session.user?.role } : null);
    
    if (!session?.user?.id || session.user.role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const guideId = params.id;
    const updateData = await request.json();

    await connectToDatabase();

    console.log("Update data received:", JSON.stringify(updateData, null, 2));
    console.log("Guide ID:", guideId);

    const updatedGuide = await Guide.findByIdAndUpdate(
      guideId,
      {
        ...updateData,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );

    console.log("Updated guide result:", updatedGuide ? "Success" : "Not found");

    if (!updatedGuide) {
      return NextResponse.json({ error: "Guide not found" }, { status: 404 });
    }

    return NextResponse.json({ 
      message: "Guide updated successfully", 
      guide: updatedGuide 
    });

  } catch (error) {
    console.error("Error updating guide:", error);
    console.error("Error details:", error instanceof Error ? error.message : error);
    console.error("Stack trace:", error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log("Starting DELETE request for guide:", params.id);
    const session = await auth();
    console.log("Session:", session ? { userId: session.user?.id, role: session.user?.role } : null);
    
    if (!session?.user?.id || session.user.role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const guideId = params.id;

    await connectToDatabase();

    const deletedGuide = await Guide.findByIdAndDelete(guideId);

    if (!deletedGuide) {
      return NextResponse.json({ error: "Guide not found" }, { status: 404 });
    }

    return NextResponse.json({ 
      message: "Guide deleted successfully" 
    });

  } catch (error) {
    console.error("Error deleting guide:", error);
    console.error("Error details:", error instanceof Error ? error.message : error);
    console.error("Stack trace:", error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}