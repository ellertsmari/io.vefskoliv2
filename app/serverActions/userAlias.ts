"use server";

import { auth } from "auth";
import { connectToDatabase } from "./mongoose-connector";
import { User, UserDocument } from "models/user";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { hasTeacherPermissions } from "utils/userUtils";

export async function getAllUsers(): Promise<{ id: string; name: string; email: string; role: string }[]> {
  const session = await auth();
  
  if (!hasTeacherPermissions(session)) {
    throw new Error("Unauthorized: Only teachers can access user list");
  }

  try {
    await connectToDatabase();
    const users = await User.find({}, { _id: 1, name: 1, email: 1, role: 1 })
      .sort({ name: 1 })
      .lean();

    return users.map(user => ({
      id: (user._id as any).toString(),
      name: user.name,
      email: user.email,
      role: user.role
    }));
  } catch (error) {
    console.error("Error fetching users:", error);
    throw new Error("Failed to fetch users");
  }
}

export async function setAlias(userId: string) {
  const session = await auth();
  
  if (!hasTeacherPermissions(session)) {
    throw new Error("Unauthorized: Only teachers can set alias");
  }

  try {
    await connectToDatabase();
    const targetUser = await User.findById(userId);
    
    if (!targetUser) {
      throw new Error("User not found");
    }

    // Store the aliased user ID in a cookie
    const cookieStore = await cookies();
    cookieStore.set('aliased-user', userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 // 24 hours
    });

  } catch (error) {
    console.error("Error setting alias:", error);
    throw new Error("Failed to set alias");
  }
}

export async function clearAlias() {
  const session = await auth();
  
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  try {
    // Remove the aliased user cookie
    const cookieStore = await cookies();
    cookieStore.delete('aliased-user');

  } catch (error) {
    console.error("Error clearing alias:", error);
    throw new Error("Failed to clear alias");
  }
}