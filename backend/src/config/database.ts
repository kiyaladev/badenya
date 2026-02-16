import mongoose from 'mongoose';
import logger from '../utils/logger';

export const connectDatabase = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('MONGODB_URI environment variable is required in production');
      }
      logger.warn('⚠️  MONGODB_URI not set, using default localhost connection');
    }
    
    await mongoose.connect(mongoUri || 'mongodb://localhost:27017/badenya');
    
    logger.info('✅ MongoDB connected successfully');
    logger.info(`📊 Database: ${mongoose.connection.name}`);
  } catch (error) {
    logger.error('❌ MongoDB connection error:', error);
    throw error;
  }
};

// Handle connection events
mongoose.connection.on('disconnected', () => {
  logger.warn('⚠️  MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  logger.error('❌ MongoDB error:', err);
});

process.on('SIGINT', async () => {
  await mongoose.connection.close();
  logger.warn('MongoDB connection closed due to app termination');
  process.exit(0);
});
