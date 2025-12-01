import { getZoomToken } from "../../serverActions/Zoom/zoomToken";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const token = await getZoomToken();
    const userId = "9Oue5bIHSMCyTRPy3p1HkA";
    
    // Try different query parameters
    const tests = [];
    
    // Test 1: Basic query (current)
    tests.push({
      name: "Basic query",
      url: `https://api.zoom.us/v2/users/${userId}/recordings?from=2025-08-15&to=2025-10-24&page_size=300`
    });
    
    // Test 2: With trash parameter
    tests.push({
      name: "Include trash",
      url: `https://api.zoom.us/v2/users/${userId}/recordings?from=2025-08-15&to=2025-10-24&page_size=300&trash=true`
    });
    
    // Test 3: With mc (meeting cloud) parameter
    tests.push({
      name: "With mc=true",
      url: `https://api.zoom.us/v2/users/${userId}/recordings?from=2025-08-15&to=2025-10-24&page_size=300&mc=true`
    });
    
    // Test 4: Without pagination limit
    tests.push({
      name: "Page size 1",
      url: `https://api.zoom.us/v2/users/${userId}/recordings?from=2025-08-15&to=2025-10-24&page_size=1`
    });
    
    const results = [];
    
    for (const test of tests) {
      const res = await fetch(test.url, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      
      const data = await res.json();
      results.push({
        test: test.name,
        total_records: data.total_records,
        meetings_returned: data.meetings?.length || 0,
        has_next_page: !!data.next_page_token
      });
    }
    
    return NextResponse.json({ results });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
