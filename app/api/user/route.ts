import { NextRequest } from "next/server";
import { getUser } from "../../../auth";
import { UserDocument } from "../../models/user";

export async function POST(req: NextRequest) {
  const { email, info } = await req.json();
  if (!email || !info) {
    return new Response(
      JSON.stringify({ error: "Missing email or info in request body" }),
      { status: 400 }
    );
  }

  const user: UserDocument | null = await getUser(email);
  console.log("user", user);
  if (user) {
    try {
      await user?.updateUserInfo(info);
      return new Response(JSON.stringify({ message: "User info updated" }), {
        status: 200,
      });
    } catch (error) {
      return new Response(
        JSON.stringify({ error: "Failed to update user info" }),
        { status: 500 }
      );
    }
  }

  return new Response(JSON.stringify({ error: "User not found" }), {
    status: 404,
  });
}
