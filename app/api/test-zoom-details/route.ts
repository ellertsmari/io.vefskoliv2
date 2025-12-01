import { getZoomToken } from "../../serverActions/Zoom/zoomToken";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const token = await getZoomToken();

    const url = `https://api.zoom.us/v2/users/me/recordings?from=2025-11-01&to=2025-11-30&page_size=1`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    const data = await res.json();

    // Return full structure of first meeting to see all available fields
    return NextResponse.json({
      success: true,
      meetingKeys: data.meetings?.[0] ? Object.keys(data.meetings[0]) : [],
      meeting: data.meetings?.[0] || null,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
