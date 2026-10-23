import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "../../../auth";
import { getAnalyticsDashboard } from "../../lib/analytics/stats";
import { ErrorState } from "UIcomponents/states/States";
import { parseRange } from "utils/analytics";
import { hasTeacherPermissions } from "utils/userUtils";
import { AnalyticsPage } from "./AnalyticsPage";

export const metadata: Metadata = {
  title: "Site analytics | Vefskólinn LMS",
  description: "Public visitors and crawlers on the guides and showcase.",
};

// Live numbers, per request.
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ days?: string | string[] }> };

export default async function Analytics({ searchParams }: Props) {
  // The proxy redirects anonymous visitors; this keeps students out. Teachers
  // viewing as a student keep their teacher tools, as on the reports page.
  const session = await auth();
  if (!hasTeacherPermissions(session)) redirect("/");

  const range = parseRange((await searchParams).days);

  try {
    const dashboard = await getAnalyticsDashboard(range);
    return <AnalyticsPage dashboard={dashboard} />;
  } catch (error) {
    console.error("Failed to load the analytics dashboard:", error);
    return (
      <ErrorState message="We couldn't load the analytics. Please refresh the page in a moment." />
    );
  }
}
