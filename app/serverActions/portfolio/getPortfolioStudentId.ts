
"use server";

import { auth } from "../../../auth";

export async function getPortfolioStudentId(): Promise<string | null> {
  const session = await auth();

  return session?.user?.id ?? null;
}
