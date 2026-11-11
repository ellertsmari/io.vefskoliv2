"use server";

import { auth } from "../../auth";
import { isActingAsTeacher } from "utils/userUtils";
import { Review
 } from "../models/review";
import { Return } from "../models/return";
import { User } from "../models/user";
import { Guide } from "../models/guide";
import { safeSerialize } from "../utils/serialization";

export type UngradedReviewWithDetails = {
  _id: string;
  comment: string;
  vote: string;
  createdAt: Date;
  guide: {
    _id: string;
    title: string;
    /** For naming the return's links (repository/live page or file/prototype). */
    discipline?: string;
    category?: string;
  };
  return: {
    _id: string;
    projectName: string;
    projectUrl: string;
    liveVersion: string;
  };
  reviewer: {
    _id: string;
    name: string;
  };
  returnOwner: {
    _id: string;
    name: string;
  };
};

type Id = { toString(): string };

// What each query selects. The models are loosely typed, so the shapes are
// spelled out here.
type ReviewRow = {
  _id: Id;
  comment: string;
  vote: string;
  createdAt: Date;
  guide?: Id;
  return?: Id;
  owner?: Id;
};
type GuideRow = { _id: Id; title: string; discipline?: string | null; category?: string };
type ReturnRow = {
  _id: Id;
  projectName: string;
  projectUrl: string;
  liveVersion: string;
  owner?: Id;
};
type UserRow = { _id: Id; name: string };

const byId = <T extends { _id: Id }>(docs: T[]) =>
  new Map(docs.map((doc) => [doc._id.toString(), doc]));

const uniqueIds = (ids: Array<Id | null | undefined>) => [
  ...new Set(ids.filter((id): id is Id => id != null).map((id) => id.toString())),
];

/**
 * The grading queue, oldest first, in four queries however long it is: the
 * reviews, then their guides, returns and people by `$in`. A review whose
 * guide, return, reviewer or return owner no longer exists is left out.
 */
const loadUngradedReviews = async (): Promise<UngradedReviewWithDetails[]> => {
  const reviews = await Review.find({
    $or: [{ grade: null }, { grade: { $exists: false } }],
  })
    .select("comment vote createdAt guide return owner")
    .sort({ createdAt: 1 })
    .lean<ReviewRow[]>();
  if (reviews.length === 0) return [];

  const [guideDocs, returnDocs] = await Promise.all([
    Guide.find({ _id: { $in: uniqueIds(reviews.map((r) => r.guide)) } })
      .select("title discipline category")
      .lean<GuideRow[]>(),
    Return.find({ _id: { $in: uniqueIds(reviews.map((r) => r.return)) } })
      .select("projectName projectUrl liveVersion owner")
      .lean<ReturnRow[]>(),
  ]);
  const userDocs = await User.find({
    _id: {
      $in: uniqueIds([
        ...reviews.map((r) => r.owner),
        ...returnDocs.map((r) => r.owner),
      ]),
    },
  })
    .select("name")
    .lean<UserRow[]>();

  const guides = byId(guideDocs);
  const returns = byId(returnDocs);
  const users = byId(userDocs);

  const queue: UngradedReviewWithDetails[] = [];
  for (const review of reviews) {
    const guide = guides.get(String(review.guide));
    const returnDoc = returns.get(String(review.return));
    const reviewer = users.get(String(review.owner));
    if (!guide || !returnDoc || !reviewer) continue;

    const returnOwner = users.get(String(returnDoc.owner));
    if (!returnOwner) continue;

    queue.push({
      _id: review._id.toString(),
      comment: review.comment,
      vote: review.vote,
      createdAt: review.createdAt,
      guide: {
        _id: guide._id.toString(),
        title: guide.title,
        discipline: guide.discipline ?? undefined,
        category: guide.category,
      },
      return: {
        _id: returnDoc._id.toString(),
        projectName: returnDoc.projectName,
        projectUrl: returnDoc.projectUrl,
        liveVersion: returnDoc.liveVersion,
      },
      reviewer: { _id: reviewer._id.toString(), name: reviewer.name },
      returnOwner: { _id: returnOwner._id.toString(), name: returnOwner.name },
    });
  }
  return queue;
};

const isTeacherSession = async () => isActingAsTeacher(await auth());

export async function getUngradedReviews(): Promise<UngradedReviewWithDetails[]> {
  if (!(await isTeacherSession())) return [];

  try {
    return safeSerialize(await loadUngradedReviews());
  } catch (error) {
    console.error("[getUngradedReviews] Error:", error);
    return [];
  }
}

/**
 * How many reviews the grading modal would list. Counted from the same queue
 * as the list, so the dashboard card and the modal cannot disagree, but only
 * the number crosses to the browser.
 */
export async function getUngradedReviewCount(): Promise<number> {
  if (!(await isTeacherSession())) return 0;

  try {
    return (await loadUngradedReviews()).length;
  } catch (error) {
    console.error("[getUngradedReviewCount] Error:", error);
    return 0;
  }
}
