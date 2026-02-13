import mongoose, { Document, Schema } from 'mongoose';

export type NotificationType =
  | 'group_invitation'
  | 'member_joined'
  | 'proposal_created'
  | 'proposal_approved'
  | 'proposal_rejected'
  | 'contribution_received'
  | 'vote_reminder'
  | 'payment_reminder'
  | 'expense_executed'
  | 'role_changed'
  | 'group_archived';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  data?: {
    groupId?: mongoose.Types.ObjectId;
    proposalId?: mongoose.Types.ObjectId;
    transactionId?: mongoose.Types.ObjectId;
    amount?: number;
    actionUrl?: string;
  };
  isRead: boolean;
  readAt?: Date;
  priority: 'low' | 'normal' | 'high';
  createdAt: Date;
  expiresAt?: Date;
}

const NotificationSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        'group_invitation',
        'member_joined',
        'proposal_created',
        'proposal_approved',
        'proposal_rejected',
        'contribution_received',
        'vote_reminder',
        'payment_reminder',
        'expense_executed',
        'role_changed',
        'group_archived',
      ],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: 100,
    },
    message: {
      type: String,
      required: true,
      maxlength: 500,
    },
    data: {
      groupId: {
        type: Schema.Types.ObjectId,
        ref: 'Group',
      },
      proposalId: {
        type: Schema.Types.ObjectId,
        ref: 'Proposal',
      },
      transactionId: {
        type: Schema.Types.ObjectId,
        ref: 'Transaction',
      },
      amount: Number,
      actionUrl: String,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: Date,
    priority: {
      type: String,
      enum: ['low', 'normal', 'high'],
      default: 'normal',
    },
    expiresAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes
NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

export default mongoose.model<INotification>('Notification', NotificationSchema);
