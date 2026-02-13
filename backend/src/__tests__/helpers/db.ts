import mongoose from 'mongoose';

/**
 * Connect to the test database
 * Uses TEST_MONGODB_URI environment variable or a test database
 */
export const connect = async () => {
  const uri = process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/badenya_test';
  
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri);
  }
};

/**
 * Drop database and close the connection
 */
export const closeDatabase = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  }
};

/**
 * Remove all the data for all db collections
 */
export const clearDatabase = async () => {
  const collections = mongoose.connection.collections;
  
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
};
