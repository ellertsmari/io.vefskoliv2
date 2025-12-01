import { getZoomToken } from "../../serverActions/Zoom/zoomToken";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from") || "2025-08-18";
    const to = searchParams.get("to") || "2025-12-01";

    const token = await getZoomToken();

    const url = `https://api.zoom.us/v2/users/me/recordings?from=${from}&to=${to}&page_size=300`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    const data = await res.json();

    return NextResponse.json({
      from,
      to,
      total: data.total_records || 0,
      meetings: data.meetings?.length || 0,
      hasNextPage: !!data.next_page_token,
      firstMeeting: data.meetings?.[0]?.topic,
      firstDate: data.meetings?.[0]?.start_time,
      lastMeeting: data.meetings?.[data.meetings?.length - 1]?.topic,
      lastDate: data.meetings?.[data.meetings?.length - 1]?.start_time,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
