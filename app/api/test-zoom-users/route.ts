import { getZoomToken } from "../../serverActions/Zoom/zoomToken";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const token = await getZoomToken();
    
    // Get all users
    const usersRes = await fetch("https://api.zoom.us/v2/users?page_size=300&status=active", {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    
    const usersData = await usersRes.json();
    
    return NextResponse.json({
      success: true,
      totalUsers: usersData.users?.length || 0,
      users: usersData.users?.map((u: any) => ({
        id: u.id,
        email: u.email,
        type: u.type,
        status: u.status
      })) || []
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
