import mongoose, { Schema, Document, Model } from 'mongoose';

// Interface for LTI state document
export interface ILTIState extends Document {
  state: string;
  nonce: string;
  targetLinkUri?: string;
  deepLinkingReturnUrl?: string;
  timestamp: Date;
  createdAt: Date;
}

// Schema with TTL index for automatic expiration
const ltiStateSchema = new Schema<ILTIState>({
  state: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  nonce: {
    type: String,
    required: true,
  },
  targetLinkUri: {
    type: String,
    required: false,
  },
  deepLinkingReturnUrl: {
    type: String,
    required: false,
  },
  timestamp: {
    type: Date,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300, // TTL: automatically delete after 5 minutes (300 seconds)
  },
});

// Create model
export const LTIState: Model<ILTIState> = mongoose.models.LTIState || 
  mongoose.model<ILTIState>('LTIState', ltiStateSchema);

/**
 * Store state and nonce for LTI authentication
 * Automatically expires after 5 minutes
 */
export async function storeLTIState(
  state: string,
  nonce: string,
  options?: {
    targetLinkUri?: string;
    deepLinkingReturnUrl?: string;
  }
): Promise<void> {
  try {
    await LTIState.create({
      state,
      nonce,
      targetLinkUri: options?.targetLinkUri,
      deepLinkingReturnUrl: options?.deepLinkingReturnUrl,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Failed to store LTI state:', error);
    throw new Error('Failed to store authentication state');
  }
}

/**
 * Retrieve and validate LTI state
 * Returns null if state doesn't exist or has expired
 */
export async function retrieveLTIState(
  state: string
): Promise<ILTIState | null> {
  try {
    const stateDoc = await LTIState.findOne({ state });
    return stateDoc;
  } catch (error) {
    console.error('Failed to retrieve LTI state:', error);
    return null;
  }
}

/**
 * Consume (delete) LTI state after use
 * Ensures state can only be used once (prevents replay attacks)
 */
export async function consumeLTIState(state: string): Promise<void> {
  try {
    await LTIState.deleteOne({ state });
  } catch (error) {
    console.error('Failed to consume LTI state:', error);
    // Don't throw - already used the state, just log the error
  }
}

/**
 * Validate state and nonce match
 * Also checks that state hasn't expired
 */
export async function validateLTIState(
  state: string,
  nonce: string
): Promise<{
  valid: boolean;
  stateData?: ILTIState;
  error?: string;
}> {
  try {
    const stateDoc = await retrieveLTIState(state);
    
    if (!stateDoc) {
      return {
        valid: false,
        error: 'Invalid or expired state',
      };
    }

    // Check if state has expired (older than 5 minutes)
    const now = Date.now();
    const stateAge = now - stateDoc.timestamp.getTime();
    const maxAge = 5 * 60 * 1000; // 5 minutes in milliseconds

    if (stateAge > maxAge) {
      await consumeLTIState(state);
      return {
        valid: false,
        error: 'State has expired',
      };
    }

    // Validate nonce matches
    if (stateDoc.nonce !== nonce) {
      return {
        valid: false,
        error: 'Nonce mismatch',
      };
    }

    return {
      valid: true,
      stateData: stateDoc,
    };
  } catch (error) {
    console.error('Failed to validate LTI state:', error);
    return {
      valid: false,
      error: 'State validation failed',
    };
  }
}

/**
 * Clean up expired states (called periodically)
 * MongoDB TTL index should handle this automatically, but this is a backup
 */
export async function cleanupExpiredStates(): Promise<void> {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    await LTIState.deleteMany({
      timestamp: { $lt: fiveMinutesAgo },
    });
  } catch (error) {
    console.error('Failed to cleanup expired states:', error);
  }
}
