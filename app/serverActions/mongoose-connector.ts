import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_CONNECTION;

let cachedConnection: typeof mongoose | null = null;

// Simple logger that only logs in development
const logger = {
  info: (message: string, ...args: unknown[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DB] ${message}`, ...args);
    }
  },
  error: (message: string, error?: unknown) => {
    console.error(`[DB Error] ${message}`, error instanceof Error ? error.message : error);
  },
};

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (!MONGODB_URI) {
    logger.error('MONGODB_CONNECTION environment variable is missing');
    throw new Error('Please define the MONGODB_CONNECTION environment variable inside .env.local');
  }

  // Check if we have a valid cached connection
  if (cachedConnection && cachedConnection.connection.readyState === 1) {
    return cachedConnection;
  }

  try {
    // Disconnect any existing connection
    if (cachedConnection) {
      try {
        await cachedConnection.disconnect();
      } catch (disconnectError) {
        logger.info('Error disconnecting previous connection', disconnectError);
      }
      cachedConnection = null;
    }

    const connection = await mongoose.connect(MONGODB_URI as string, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      heartbeatFrequencyMS: 10000,
      bufferCommands: false,
    });

    logger.info('MongoDB connected successfully');
    cachedConnection = connection;

    // Handle connection events
    connection.connection.on('error', (error) => {
      logger.error('MongoDB connection error', error);
      cachedConnection = null;
    });

    connection.connection.on('disconnected', () => {
      logger.info('MongoDB disconnected');
      cachedConnection = null;
    });

    connection.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

    // Wait a moment to ensure connection is fully established
    await new Promise(resolve => setTimeout(resolve, 100));

    return connection;
  } catch (error) {
    logger.error('Failed to connect to MongoDB', error);
    cachedConnection = null;
    throw new Error('Failed to connect to database');
  }
}

export async function disconnectFromDatabase(): Promise<void> {
  if (cachedConnection) {
    await cachedConnection.disconnect();
    cachedConnection = null;
  }
}
