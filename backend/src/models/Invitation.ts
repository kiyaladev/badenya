import mongoose, { Document, Schema } from 'mongoose';

export interface IInvitation extends Document {
  groupId: mongoose.Types.ObjectId;
  invitedBy: mongoose.Types.ObjectId;
  email: string;
  phone?: string;
  token: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  expiresAt: Date;
  acceptedAt?: Date;
  createdAt: Date;
}

const InvitationSchema: Schema = new Schema(
  {
    groupId: {
      type: Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
      index: true,
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    phone: String,
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'expired'],
      default: 'pending',
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    acceptedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes
InvitationSchema.index({ email: 1, groupId: 1 });
InvitationSchema.index({ status: 1, expiresAt: 1 });

export default mongoose.model<IInvitation>('Invitation', InvitationSchema);
