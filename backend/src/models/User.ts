import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
  role: 'user' | 'admin';
  avatar?: {
    url: string;
    filename: string;
  };
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  refreshTokens: Array<{
    token: string;
    deviceId: string;
    deviceName: string;
    createdAt: Date;
    expiresAt: Date;
  }>;
  preferences: {
    language: 'fr' | 'en' | 'ar';
    currency: string;
    notifications: {
      push: boolean;
      email: boolean;
      proposalCreated: boolean;
      proposalVoted: boolean;
      contributionReceived: boolean;
    };
    theme: 'light' | 'dark' | 'auto';
  };
  lastLoginAt?: Date;
  lastActiveAt?: Date;
  deviceTokens: string[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      unique: true,
      sparse: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    avatar: {
      url: String,
      filename: String,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: String,
    passwordResetToken: String,
    passwordResetExpires: Date,
    refreshTokens: [
      {
        token: String,
        deviceId: String,
        deviceName: String,
        createdAt: Date,
        expiresAt: Date,
      },
    ],
    preferences: {
      language: {
        type: String,
        enum: ['fr', 'en', 'ar'],
        default: 'fr',
      },
      currency: {
        type: String,
        default: 'XOF',
      },
      notifications: {
        push: { type: Boolean, default: true },
        email: { type: Boolean, default: true },
        proposalCreated: { type: Boolean, default: true },
        proposalVoted: { type: Boolean, default: true },
        contributionReceived: { type: Boolean, default: true },
      },
      theme: {
        type: String,
        enum: ['light', 'dark', 'auto'],
        default: 'auto',
      },
    },
    lastLoginAt: Date,
    lastActiveAt: Date,
    deviceTokens: [String],
  },
  {
    timestamps: true,
  }
);

// Indexes
UserSchema.index({ fullName: 'text' });

export default mongoose.model<IUser>('User', UserSchema);
