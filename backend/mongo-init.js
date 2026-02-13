// MongoDB initialization script for Docker
// This creates the application database and user

db = db.getSiblingDB('badenya');

// Create application user
db.createUser({
  user: process.env.MONGO_APP_USER || 'badenya',
  pwd: process.env.MONGO_APP_PASSWORD,
  roles: [
    {
      role: 'readWrite',
      db: 'badenya'
    }
  ]
});

// Create indexes for better performance
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ phoneNumber: 1 }, { sparse: true });
db.groups.createIndex({ name: 1 });
db.groups.createIndex({ 'members.user': 1 });
db.transactions.createIndex({ group: 1, createdAt: -1 });
db.transactions.createIndex({ createdBy: 1 });
db.votes.createIndex({ group: 1, status: 1 });
db.notifications.createIndex({ user: 1, read: 1, createdAt: -1 });

print('MongoDB initialized successfully');
