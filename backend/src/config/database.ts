import mongoose from 'mongoose';

export const connectDatabase = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('MONGODB_URI environment variable is required in production');
      }
      console.warn('⚠️  MONGODB_URI not set, using default localhost connection');
    }
    
    await mongoose.connect(mongoUri || 'mongodb://localhost:27017/badenya');
    
    console.warn('✅ MongoDB connected successfully');
    console.warn(`📊 Database: ${mongoose.connection.name}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
};

// Handle connection events
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB error:', err);
});

process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.warn('MongoDB connection closed due to app termination');
  process.exit(0);
});
