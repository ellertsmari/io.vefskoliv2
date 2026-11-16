import mongoose, { Schema } from "mongoose";
import { connectToDatabase } from "serverActions/mongoose-connector";

/**
 * Every query connects itself.
 *
 * Mongoose does not connect on demand: `bufferCommands` makes a query wait for
 * a connection that is being established, but nothing starts one. Callers used
 * to do that by hand with `connectToDatabase()`, and three server actions that
 * forgot broke in production only (a page render in the same process hides the
 * omission in development).
 *
 * This registers a global plugin whose hooks run `connectToDatabase()` before
 * any operation. That call returns immediately when the connection is up.
 *
 * ORDER MATTERS. Mongoose copies a schema's hooks when the model is compiled,
 * so a plugin registered afterwards does nothing for that model, and hooks
 * cannot be added to it later (measured on mongoose 8.24: every operation on
 * such a model fails with "Client must be connected"). Every file that calls
 * `model()` therefore imports this module FIRST. Imports are evaluated before
 * the importing module's body, which is what makes the order certain;
 * `__tests__/architecture/modelsAutoConnect.test.ts` fails the build if a
 * model file leaves the import out.
 */

const QUERY_AND_DOCUMENT = ["updateOne", "deleteOne"] as const;
const OTHER_OPERATIONS = [
  "save",
  "aggregate",
  "insertMany",
  "bulkWrite",
  "updateMany",
  "deleteMany",
  "replaceOne",
  "countDocuments",
  "estimatedDocumentCount",
  "distinct",
] as const;

const ensureConnected = async () => {
  await connectToDatabase();
};

export const autoConnectPlugin = (schema: Schema) => {
  // find, findOne, findOneAndUpdate, findOneAndDelete, … (findById and exists
  // are findOne underneath).
  schema.pre(/^find/, ensureConnected);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema.pre([...OTHER_OPERATIONS] as any, ensureConnected);
  // These two are query middleware by default; a loaded document calling
  // doc.updateOne() / doc.deleteOne() needs the document flavour as well.
  schema.pre(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [...QUERY_AND_DOCUMENT] as any,
    { document: true, query: true },
    ensureConnected
  );
};

// On globalThis because mongoose itself is one instance per process while this
// module is re-evaluated on every hot reload; registering twice would run the
// hook twice per query.
const globalWithFlag = globalThis as typeof globalThis & {
  _mongooseAutoConnect?: boolean;
};

if (!globalWithFlag._mongooseAutoConnect) {
  mongoose.plugin(autoConnectPlugin);
  globalWithFlag._mongooseAutoConnect = true;
}
