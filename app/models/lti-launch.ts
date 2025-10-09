import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ILTILaunch extends Document {
  userId: string;
  contextId: string;
  resourceLinkId: string;
  deploymentId: string;
  issuer: string;
  targetLinkUri: string;
  lineitemsUrl?: string;
  lineitemUrl?: string;
  contextTitle?: string;
  resourceLinkTitle?: string;
  roles: string[];
  createdAt: Date;
  lastAccessed: Date;
}

const ltiLaunchSchema = new Schema<ILTILaunch>({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  contextId: {
    type: String,
    required: true,
    index: true,
  },
  resourceLinkId: {
    type: String,
    required: true,
    index: true,
  },
  deploymentId: {
    type: String,
    required: true,
  },
  issuer: {
    type: String,
    required: true,
  },
  targetLinkUri: {
    type: String,
    required: true,
  },
  lineitemsUrl: {
    type: String,
    required: false,
  },
  lineitemUrl: {
    type: String,
    required: false,
  },
  contextTitle: {
    type: String,
    required: false,
  },
  resourceLinkTitle: {
    type: String,
    required: false,
  },
  roles: [{
    type: String,
    required: true,
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastAccessed: {
    type: Date,
    default: Date.now,
  },
});

// Compound index for efficient lookups
ltiLaunchSchema.index({ userId: 1, contextId: 1, resourceLinkId: 1 }, { unique: true });

export const LTILaunch: Model<ILTILaunch> = mongoose.models.LTILaunch || 
  mongoose.model<ILTILaunch>('LTILaunch', ltiLaunchSchema);