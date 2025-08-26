import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_CONNECTION;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_CONNECTION environment variable inside .env.local');
}

let cachedConnection: typeof mongoose | null = null;

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cachedConnection && cachedConnection.connection.readyState === 1) {
    return cachedConnection;
  }

  try {
    if (cachedConnection) {
      await cachedConnection.disconnect();
    }

    const connection = await mongoose.connect(MONGODB_URI as string, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    cachedConnection = connection;

    // Handle connection events
    connection.connection.on('error', (error) => {
      console.error('MongoDB connection error:', error);
      cachedConnection = null;
    });

    connection.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
      cachedConnection = null;
    });

    return connection;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
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
