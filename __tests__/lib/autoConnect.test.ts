/**
 * @jest-environment node
 *
 * The plugin in models/autoConnect must connect before every kind of
 * operation the app uses, starting from a disconnected mongoose.
 */
import mongoose, { Schema, model } from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { connectToDatabase } from "serverActions/mongoose-connector";
import "models/autoConnect";

jest.mock("serverActions/mongoose-connector", () => ({
  connectToDatabase: jest.fn(),
}));

const mongod = new MongoMemoryServer();
const Probe = model("AutoConnectProbe", new Schema({ n: Number }));
const id = () => new mongoose.Types.ObjectId();

const operations: Record<string, () => Promise<unknown>> = {
  find: () => Probe.find({}),
  findOne: () => Probe.findOne({}),
  findById: () => Probe.findById(id()),
  findOneAndUpdate: () => Probe.findOneAndUpdate({}, { n: 2 }),
  findByIdAndUpdate: () => Probe.findByIdAndUpdate(id(), { n: 2 }),
  findOneAndDelete: () => Probe.findOneAndDelete({ n: -1 }),
  exists: () => Probe.exists({ n: 1 }),
  create: () => Probe.create({ n: 1 }),
  save: () => new Probe({ n: 1 }).save(),
  insertMany: () => Probe.insertMany([{ n: 1 }]),
  updateOne: () => Probe.updateOne({}, { n: 3 }),
  updateMany: () => Probe.updateMany({}, { n: 3 }),
  replaceOne: () => Probe.replaceOne({ n: -1 }, { n: 3 }),
  deleteOne: () => Probe.deleteOne({ n: -1 }),
  deleteMany: () => Probe.deleteMany({ n: -1 }),
  countDocuments: () => Probe.countDocuments({}),
  estimatedDocumentCount: () => Probe.estimatedDocumentCount(),
  distinct: () => Probe.distinct("n"),
  aggregate: () => Probe.aggregate([{ $match: {} }]),
  bulkWrite: () => Probe.bulkWrite([{ insertOne: { document: { n: 5 } } }]),
};

beforeAll(async () => {
  await mongod.start();
  (connectToDatabase as jest.Mock).mockImplementation(async () => {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(mongod.getUri());
    }
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

describe("models/autoConnect", () => {
  it.each(Object.keys(operations))("%s connects first", async (name) => {
    await mongoose.disconnect();
    (connectToDatabase as jest.Mock).mockClear();

    await operations[name]();

    expect(connectToDatabase).toHaveBeenCalled();
    expect(mongoose.connection.readyState).toBe(1);
  });
});
