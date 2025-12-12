// This file is used to create dummy data for testing purposes
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { User, UserDocument, UserInfo } from "models/user";
import { faker } from "@faker-js/faker";
import {
  ReviewDocument,
  ReviewType,
  Review,
  GradedReviewDocument,
  GradedReviewType,
  Vote,
} from "models/review";
import { Return, ReturnDocument, ReturnType } from "models/return";
import { Guide, GuideDocument, GuideType } from "models/guide";
import {
  ExtendedGuideInfo,
  ReviewDocumentWithReturn,
  GuideInfo,
  Module,
} from "types/guideTypes";
import { extendGuides } from "utils/guideUtils";

jest.mock("serverActions/mongoose-connector", () => ({
  connectToDatabase: jest.fn(),
}));

const mongod = new MongoMemoryServer();

export const connect = async () => {
  await mongod.start();
  const uri = await mongod.getUri();

  await mongoose.connect(uri);
};

export const closeDatabase = async (): Promise<void> => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongod.stop();
};

export const clearDatabase = async (): Promise<void> => {
  const collections = mongoose.connection.collections;

  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
};

export const createDummyUser = async (
  role: "user" | "teacher" = "user",
  dummyUserInfo?: Partial<UserInfo>
): Promise<UserDocument> => {
  const dummyUser: UserInfo = {
    name: faker.person.firstName(),
    email: faker.internet.email(),
    password: faker.internet.password(),
    role,
    createdAt: new Date(),
    background: faker.person.bio(),
    careerGoals: faker.lorem.sentence(),
    interests: faker.lorem.sentence(),
    favoriteArtists: faker.lorem.sentence(),
    avatarUrl: faker.image.url(),
    ...dummyUserInfo,
  };

  return await User.create(dummyUser);
};

export const createDummyGuide = async (): Promise<GuideDocument> => {
  const dummyGuide: Partial<GuideType> = {
    category: faker.lorem.word(),
    title: faker.lorem.sentence(),
    description: faker.lorem.paragraph(),
    createdAt: new Date(),
    updatedAt: new Date(),
    themeIdea: {
      title: faker.lorem.sentence(),
      description: faker.lorem.paragraph(),
    },
    topicsList: faker.lorem.words(),
    module: {
      title: Math.floor(Math.random() * 10) + faker.lorem.sentence(),
      number: faker.number.int(10),
    },
    order: faker.number.int(50),
  };

  return await Guide.create(dummyGuide);
};

export const createDummyModules = (count: number): Module[] => {
  const modules = [];
  for (let i = 0; i < count; i++) {
    const module = {
      title: i + faker.lorem.sentence(),
      number: i,
    };
    modules.push(module);
  }
  return modules;
};

export const createDummyReturn = async (
  user?: UserDocument,
  guide?: GuideDocument | ExtendedGuideInfo
): Promise<ReturnDocument> => {
  const dummyReturn: Partial<ReturnType> = {
    projectUrl: faker.internet.url(),
    liveVersion: faker.internet.url(),
    pictureUrl: faker.image.url(),
    projectName: faker.commerce.productName(),
    comment: faker.lorem.sentence(),
    owner: user?._id ?? new mongoose.Types.ObjectId(),
    createdAt: new Date(),
    guide: guide?._id ?? new mongoose.Types.ObjectId(),
  };

  const result = await Return.create(dummyReturn);
  if (!result) throw new Error("Failed to create dummy return");
  return result;
};

export const createDummyReview = async (
  owner?: UserDocument,
  guide?: GuideDocument,
  userReturn?: ReturnDocument,
  fail?: boolean
): Promise<ReviewDocument> => {
  // Create a userReturn if not provided
  if (!userReturn) {
    userReturn = await createDummyReturn(undefined, guide);
  }

  // Ensure userReturn is defined before proceeding
  if (!userReturn) throw new Error("No userReturn provided");

  // Now we can safely create the dummy review
  const dummyReview: Partial<ReviewType> = {
    guide: guide?._id ?? new mongoose.Types.ObjectId(),
    return: userReturn._id, // userReturn is guaranteed to be defined here
    owner: owner?._id ?? new mongoose.Types.ObjectId(),
    comment: faker.lorem.sentence(),
    vote: fail ? Vote.NO_PASS : Vote.PASS,
    createdAt: new Date(),
  };

  const review = await Review.create(dummyReview);

  return review; // Return the created review
};

/** @deprecated Use createDummyReview instead */
export const createDummyFeedback = createDummyReview;

export const createDummyReviewWithReturn = async (
  owner?: UserDocument,
  guide?: GuideDocument,
  userReturn?: ReturnDocument,
  fail?: boolean
): Promise<ReviewDocumentWithReturn> => {
  const review = await createDummyReview(owner, guide, userReturn, fail);
  const reviewWithReturn = review.toObject();
  reviewWithReturn.associatedReturn = userReturn?.toObject();
  return reviewWithReturn;
};

/** @deprecated Use createDummyReviewWithReturn instead */
export const createDummyFeedbackWithReturn = createDummyReviewWithReturn;

export const createDummyGrade = async (
  owner?: UserDocument,
  guide?: GuideDocument,
  userReturn?: ReturnDocument,
  grade?: number
): Promise<GradedReviewDocument> => {
  // Create a userReturn if not provided
  if (!userReturn) {
    userReturn = await createDummyReturn(undefined, guide);
  }

  // Ensure userReturn is defined before proceeding
  if (!userReturn) throw new Error("No userReturn provided");
  const votes = [Vote.NO_PASS, Vote.PASS, Vote.RECOMMEND_TO_GALLERY];

  const dummyReview: Partial<GradedReviewType> = {
    guide: guide?._id ?? new mongoose.Types.ObjectId(),
    return: userReturn?._id ?? new mongoose.Types.ObjectId(),
    grade: grade ?? faker.number.int(10),
    owner: owner?._id ?? new mongoose.Types.ObjectId(),
    comment: faker.lorem.sentence(),
    vote: votes[Math.floor(Math.random() * votes.length)],
    createdAt: new Date(),
  };

  const result = await Review.create(dummyReview)
    .then((review) => review.toObject())
    .then((review) => {
      review.associatedReturn = userReturn!.toObject();
      return review;
    });

  if (!result) throw new Error("Failed to create dummy grade");

  return result;
};

export const createDummyFetchedGuides = async (
  user: UserDocument,
  count: number
): Promise<GuideInfo[]> => {
  const guides = [];
  for (let i = 0; i < count; i++) {
    const guide = await createDummyGuide();
    const fetchedGuide: GuideInfo = {
      _id: guide._id,
      title: guide.title,
      description: guide.description,
      category: guide.category,
      order: 0,
      module: guide.module,
      returnsSubmitted:
        Math.random() > 0.5 ? [await createDummyReturn(user, guide)] : [],
      reviewsReceived:
        Math.random() > 0.5
          ? [await createDummyReview(undefined, guide)]
          : [],
      availableForReview:
        Math.random() > 0.5 ? [await createDummyReturn(undefined, guide)] : [],
      reviewsGiven:
        Math.random() > 0.5 ? [await createDummyReview(user, guide)] : [],
      gradesReceived:
        Math.random() > 0.5 ? [await createDummyGrade(user, guide)] : [],
      gradesGiven:
        Math.random() > 0.5 ? [await createDummyGrade(undefined, guide)] : [],
      availableToGrade:
        Math.random() > 0.5
          ? [await createDummyReview(undefined, guide)]
          : [],
    };
    guides.push(fetchedGuide);
  }
  return guides;
};

export const createDummyFetchedGuidedWithNoReturn = async (
  user: UserDocument
) => {
  const guide = await createDummyGuide();
  const fetchedGuide: GuideInfo = {
    _id: guide._id,
    title: guide.title,
    description: guide.description,
    category: guide.category,
    order: 0,
    module: guide.module,
    returnsSubmitted: [],
    reviewsReceived: [],
    availableForReview: [],
    reviewsGiven: [],
    gradesReceived: [],
    gradesGiven: [],
    availableToGrade: [],
  };
  const extendedGuide = await extendGuides([fetchedGuide]);
  return extendedGuide[0];
};

type dummyGuideDetails = {
  reviewsReceived?: number;
  availableForReview?: number;
  reviewsGiven?: number;
  gradesReceived?: number;
  gradesGiven?: number;
  availableToGrade?: number;
};

export const createDummyFetchedGuideWithControl = async (
  user: UserDocument,
  dummyGuideDetails: dummyGuideDetails
): Promise<ExtendedGuideInfo> => {
  const guide = await createDummyGuide();

  const userReturn = await createDummyReturn(user, guide);

  const {
    reviewsReceived,
    availableForReview,
    reviewsGiven,
    gradesReceived,
    gradesGiven,
    availableToGrade,
  } = dummyGuideDetails;

  const reviewsReceivedPromises = Array.from({
    length: reviewsReceived ?? 0,
  }).map(() => createDummyReview(undefined, guide, userReturn));

  const availableForReviewPromises = Array.from({
    length: availableForReview ?? 0,
  }).map(() => createDummyReturn(undefined, guide));

  const reviewsGivenPromises = Array.from({
    length: reviewsGiven ?? 0,
  }).map(() => createDummyReview(user, guide));

  const gradesReceivedPromises = Array.from({
    length: gradesReceived ?? 0,
  }).map(() => createDummyGrade(user, guide, userReturn));

  const gradesGivenPromises = Array.from({
    length: gradesGiven ?? 0,
  }).map(() => createDummyGrade(undefined, guide));

  const availableToGradePromises = Array.from({
    length: availableToGrade ?? 0,
  }).map(() => createDummyReview(undefined, guide));

  const fetchedGuide: GuideInfo = {
    _id: guide._id,
    title: guide.title,
    description: guide.description,
    category: guide.category,
    order: 0,
    module: guide.module,
    returnsSubmitted: [userReturn],
    reviewsReceived: await Promise.all(reviewsReceivedPromises),
    availableForReview: await Promise.all(availableForReviewPromises),
    reviewsGiven: await Promise.all(reviewsGivenPromises),
    gradesReceived: await Promise.all(gradesReceivedPromises),
    gradesGiven: await Promise.all(gradesGivenPromises),
    availableToGrade: await Promise.all(availableToGradePromises),
  };

  const extendedGuides = await extendGuides([fetchedGuide]);
  return extendedGuides[0];
};

export const createDummyExtendedGuides = async (
  user: UserDocument,
  count: number
) => {
  const dummyGuides = await createDummyFetchedGuides(user, count);
  const dummyExtendedGuides = await extendGuides(dummyGuides);
  return dummyExtendedGuides;
};
