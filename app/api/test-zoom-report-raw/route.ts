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
    
    const reportData = await reportRes.json();
    
    return NextResponse.json({
      success: reportRes.ok,
      status: reportRes.status,
      fullResponse: reportData
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
