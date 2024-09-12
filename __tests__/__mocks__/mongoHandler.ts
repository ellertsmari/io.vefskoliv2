// This file is used to create dummy data for testing purposes
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { User, UserDocument, UserInfo } from "../../app/models/user";
import { faker } from "@faker-js/faker";
import {
  FeedbackDocument,
  FeedbackType,
  Review,
  ReviewedFeedbackDocument,
  ReviewedFeedbackType,
  Vote,
} from "../../app/models/review";
import { Return, ReturnDocument, ReturnType } from "../../app/models/return";
import { Guide, GuideDocument, GuideType } from "../../app/models/guide";

jest.mock("../../app/utils/mongoose-connector", () => ({
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
  role: "user" | "teacher" = "user"
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
      title: faker.lorem.sentence(),
      number: faker.number.int(10),
    },
    order: faker.number.int(50),
  };

  return await Guide.create(dummyGuide);
};

export const createDummyReturn = async (
  user?: UserDocument,
  guide?: GuideDocument
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

  return await Return.create(dummyReturn);
};

export const createDummyFeedback = async (
  owner?: UserDocument,
  guide?: GuideDocument,
  userReturn?: ReturnType,
  fail?: boolean
): Promise<FeedbackDocument> => {
  const votes: ("no pass" | "pass" | "recommend to gallery")[] = [
    "no pass",
    "pass",
    "recommend to gallery",
  ];

  const dummyReview: Partial<FeedbackType> = {
    guide: guide?._id ?? new mongoose.Types.ObjectId(),
    return: userReturn?._id ?? new mongoose.Types.ObjectId(),
    owner: owner?._id ?? new mongoose.Types.ObjectId(),
    comment: faker.lorem.sentence(),
    vote: fail ? Vote.NO_PASS : Vote.PASS,
    createdAt: new Date(),
  };

  return await Review.create(dummyReview);
};

export const createDummyReview = async (
  owner?: UserDocument,
  guide?: GuideDocument,
  userReturn?: ReturnType,
  reviewer?: UserDocument,
  grade?: number
): Promise<ReviewedFeedbackDocument> => {
  const votes = [Vote.NO_PASS, Vote.PASS, Vote.RECOMMEND_TO_GALLERY];

  const dummyReview: Partial<ReviewedFeedbackType> = {
    guide: guide?._id ?? new mongoose.Types.ObjectId(),
    return: userReturn?._id ?? new mongoose.Types.ObjectId(),
    reviewer: reviewer?._id ?? new mongoose.Types.ObjectId(),
    grade: grade ?? faker.number.int(10),
    owner: owner?._id ?? new mongoose.Types.ObjectId(),
    comment: faker.lorem.sentence(),
    vote: votes[Math.floor(Math.random() * votes.length)],
    createdAt: new Date(),
  };

  return await Review.create(dummyReview);
};
