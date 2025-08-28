import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_CONNECTION;

let cachedConnection: typeof mongoose | null = null;

export async function connectToDatabase(): Promise<typeof mongoose> {
  console.log('🔍 Attempting to connect to MongoDB...');
  console.log('🔍 Connection string present:', !!MONGODB_URI);
  console.log('🔍 Connection string length:', MONGODB_URI?.length || 0);
  console.log('🔍 Node environment:', process.env.NODE_ENV);
  
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_CONNECTION environment variable is missing!');
    console.error('❌ Available env vars:', Object.keys(process.env).filter(key => key.includes('MONGO')));
    throw new Error('Please define the MONGODB_CONNECTION environment variable inside .env.local');
  }

  if (cachedConnection && cachedConnection.connection.readyState === 1) {
    console.log('✅ Using cached connection');
    return cachedConnection;
  }

  try {
    console.log('🔄 Creating new connection...');
    if (cachedConnection) {
      await cachedConnection.disconnect();
    }

    const connection = await mongoose.connect(MONGODB_URI as string, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 30000, // Increased from 5000ms to 30000ms (30 seconds)
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000, // Added connection timeout
      heartbeatFrequencyMS: 10000, // Keep heartbeat frequency
    });

    console.log('✅ MongoDB connected successfully!');
    console.log('✅ Connection state:', connection.connection.readyState);
    cachedConnection = connection;

    // Handle connection events
    connection.connection.on('error', (error) => {
      console.error('❌ MongoDB connection error:', error);
      cachedConnection = null;
    });

    connection.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected');
      cachedConnection = null;
    });

    return connection;
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    console.error('❌ Error details:', JSON.stringify(error, null, 2));
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
