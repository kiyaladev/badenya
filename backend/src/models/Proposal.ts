import mongoose, { Document, Schema } from 'mongoose';

export interface IProposal extends Document {
  groupId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  amount: number;
  currency: string;
  recipient?: {
    userId?: mongoose.Types.ObjectId;
    name?: string;
    details?: string;
  };
  proposedBy: mongoose.Types.ObjectId;
  attachments: Array<{
    type: 'image' | 'document' | 'link';
    url: string;
    filename?: string;
    name: string;
  }>;
  category: 'loan' | 'investment' | 'charity' | 'event' | 'emergency' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  votes: Array<{
    userId: mongoose.Types.ObjectId;
    decision: 'for' | 'against' | 'abstain';
    comment?: string;
    votedAt: Date;
  }>;
  votingDeadline: Date;
  status: 'pending' | 'approved' | 'rejected' | 'expired' | 'executed';
  result?: {
    totalVotes: number;
    votesFor: number;
    votesAgainst: number;
    votesAbstain: number;
    participationRate: number;
    decidedAt: Date;
  };
  executedAt?: Date;
  transactionId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ProposalSchema: Schema = new Schema(
  {
    groupId: {
      type: Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'XOF',
    },
    recipient: {
      userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      name: String,
      details: String,
    },
    proposedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    attachments: [
      {
        type: {
          type: String,
          enum: ['image', 'document', 'link'],
        },
        url: String,
        filename: String,
        name: String,
      },
    ],
    category: {
      type: String,
      enum: ['loan', 'investment', 'charity', 'event', 'emergency', 'other'],
      required: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    votes: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        decision: {
          type: String,
          enum: ['for', 'against', 'abstain'],
          required: true,
        },
        comment: {
          type: String,
          maxlength: 500,
        },
        votedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    votingDeadline: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'expired', 'executed'],
      default: 'pending',
      index: true,
    },
    result: {
      totalVotes: Number,
      votesFor: Number,
      votesAgainst: Number,
      votesAbstain: Number,
      participationRate: Number,
      decidedAt: Date,
    },
    executedAt: Date,
    transactionId: {
      type: Schema.Types.ObjectId,
      ref: 'Transaction',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
ProposalSchema.index({ groupId: 1, status: 1 });

export default mongoose.model<IProposal>('Proposal', ProposalSchema);
