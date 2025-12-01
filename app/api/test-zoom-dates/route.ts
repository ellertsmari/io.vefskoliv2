import { getZoomToken } from "../../serverActions/Zoom/zoomToken";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const token = await getZoomToken();
    const userId = "9Oue5bIHSMCyTRPy3p1HkA"; // The user ID we found
    
    // Test 1: With date filter (Aug 15 - today)
    const withDateUrl = `https://api.zoom.us/v2/users/${userId}/recordings?from=2025-08-15&to=2025-10-24&page_size=300`;
    const withDateRes = await fetch(withDateUrl, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const withDateData = await withDateRes.json();
    
    // Test 2: Without any date filter
    const noDateUrl = `https://api.zoom.us/v2/users/${userId}/recordings?page_size=300`;
    const noDateRes = await fetch(noDateUrl, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const noDateData = await noDateRes.json();
    
    // Test 3: With a much wider date range (last 6 months)
    const widerDateUrl = `https://api.zoom.us/v2/users/${userId}/recordings?from=2025-04-01&to=2025-10-24&page_size=300`;
    const widerDateRes = await fetch(widerDateUrl, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const widerDateData = await widerDateRes.json();
    
    return NextResponse.json({
      withDateFilter: {
        total: withDateData.total_records,
        meetings: withDateData.meetings?.length || 0,
        hasNextPage: !!withDateData.next_page_token
      },
      noDateFilter: {
        total: noDateData.total_records,
        meetings: noDateData.meetings?.length || 0,
        hasNextPage: !!noDateData.next_page_token
      },
      widerDateRange: {
        total: widerDateData.total_records,
        meetings: widerDateData.meetings?.length || 0,
        hasNextPage: !!widerDateData.next_page_token
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
