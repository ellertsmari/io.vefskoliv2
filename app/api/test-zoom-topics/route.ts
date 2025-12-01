import { getUserRecordings } from "../../serverActions/Zoom/getZoomRec";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const data = await getUserRecordings();

    // Extract unique topics
    const topics = [...new Set(data.meetings?.map((m: any) => m.topic) || [])];

    return NextResponse.json({
      success: true,
      totalRecordings: data.total_records,
      uniqueTopics: topics.length,
      topics: topics,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
