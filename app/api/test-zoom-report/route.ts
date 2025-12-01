import { getZoomToken } from "../../serverActions/Zoom/zoomToken";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const token = await getZoomToken();
    
    // Try the Report API for cloud recordings
    const reportUrl = `https://api.zoom.us/v2/report/cloud_recording?from=2025-08-15&to=2025-10-24&page_size=300`;
    const reportRes = await fetch(reportUrl, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    
    if (!reportRes.ok) {
      const errorText = await reportRes.text();
      return NextResponse.json({
        success: false,
        error: `Report API failed: ${reportRes.status} ${errorText}`
      });
    }
    
    const reportData = await reportRes.json();
    
    return NextResponse.json({
      success: true,
      api: "report/cloud_recording",
      total: reportData.total_records,
      recordings: reportData.cloud_recording?.length || 0,
      hasNextPage: !!reportData.next_page_token,
      sample: reportData.cloud_recording?.slice(0, 5).map((r: any) => ({
        topic: r.recording_name,
        start_time: r.recording_start,
        duration: r.duration
      })) || []
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
