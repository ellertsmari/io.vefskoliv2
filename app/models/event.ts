import {
  Schema,
  model,
  models,
  InferSchemaType,
 
} from "mongoose";
import mongoose from "mongoose";


//define schema structure
const eventSchema = new Schema(
  {
    id: { type: Schema.Types.String, required: true, unique: true },
    title: { type: Schema.Types.String, required: true, unique: true },
    start: { type: Schema.Types.Date, required: false },
    end: { type: Schema.Types.Date, required: false },
    color: { type: Schema.Types.String, required: false },
    owner: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User"  },

  },
  { timestamps: true }
);
// creates types
export type EventType = InferSchemaType<typeof eventSchema> 

// creates model
export const Event = models?.Event || model<EventType>("Event", eventSchema);
