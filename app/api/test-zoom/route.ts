import { getUserRecordings } from "../../serverActions/Zoom/getZoomRec";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const recordings = await getUserRecordings();
    
    return NextResponse.json({
      success: true,
      totalRecordings: recordings.total_records,
      pageCount: recordings.page_count,
      meetings: recordings.meetings.length,
      sample: recordings.meetings.slice(0, 3).map((m: any) => ({
        topic: m.topic,
        start_time: m.start_time,
        uuid: m.uuid
      }))
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
