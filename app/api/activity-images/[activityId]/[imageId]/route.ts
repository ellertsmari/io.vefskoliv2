import { auth } from "../../../../../auth";
import { ActivityEntryModel } from "models/activityEntry";
import { connectToDatabase } from "serverActions/mongoose-connector";
import { isActingAsTeacher } from "utils/userUtils";

export async function GET(_request: Request, { params }: { params: Promise<{ activityId: string; imageId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });
  const { activityId, imageId } = await params;
  if (!/^[a-f0-9]{24}$/i.test(activityId) || !/^[a-f0-9-]{36}$/i.test(imageId)) return new Response("Not found", { status: 404 });
  await connectToDatabase();
  const entry = await ActivityEntryModel.findOne({
    _id: activityId,
    ...(!isActingAsTeacher(session) ? { owner: session.user.id } : {}),
    "images.id": imageId,
  }).select({ images: { $elemMatch: { id: imageId } } }).lean<{ images?: { data: string }[] }>();
  const data = entry?.images?.[0]?.data;
  if (!data) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(Buffer.from(data, "base64")), { headers: {
    "Content-Type": "image/jpeg", "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff", "Content-Disposition": "inline; filename=activity-evidence.jpg",
  } });
}
