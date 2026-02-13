import mongoose, { Document, Schema } from 'mongoose';

export interface IGroup extends Document {
  name: string;
  description?: string;
  type: 'tontine' | 'association' | 'family' | 'friends' | 'project';
  currency: string;
  balance: number;
  targetAmount?: number;
  contributionSettings: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
    amount: number;
    dueDay?: number;
    autoReminder: boolean;
  };
  members: Array<{
    userId: mongoose.Types.ObjectId;
    role: 'admin' | 'treasurer' | 'member';
    joinedAt: Date;
    totalContributed: number;
    lastContributionAt?: Date;
    status: 'active' | 'suspended' | 'left';
  }>;
  votingRules: {
    quorum: number;
    approvalThreshold: number;
    votingDuration: number;
    allowAbstention: boolean;
  };
  stats: {
    totalContributions: number;
    totalExpenses: number;
    totalProposals: number;
    activeProposals: number;
  };
  settings: {
    isPrivate: boolean;
    requireApprovalToJoin: boolean;
    allowMemberProposals: boolean;
    maxProposalsPerMonth: number;
  };
  avatar?: {
    url: string;
    filename: string;
  };
  isActive: boolean;
  archivedAt?: Date;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const GroupSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      maxlength: 500,
    },
    type: {
      type: String,
      enum: ['tontine', 'association', 'family', 'friends', 'project'],
      required: true,
      index: true,
    },
    currency: {
      type: String,
      default: 'XOF',
    },
    balance: {
      type: Number,
      default: 0,
      min: 0,
    },
    targetAmount: Number,
    contributionSettings: {
      frequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'custom'],
        default: 'monthly',
      },
      amount: Number,
      dueDay: Number,
      autoReminder: {
        type: Boolean,
        default: true,
      },
    },
    members: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        role: {
          type: String,
          enum: ['admin', 'treasurer', 'member'],
          required: true,
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
        totalContributed: {
          type: Number,
          default: 0,
        },
        lastContributionAt: Date,
        status: {
          type: String,
          enum: ['active', 'suspended', 'left'],
          default: 'active',
        },
      },
    ],
    votingRules: {
      quorum: {
        type: Number,
        default: 50,
      },
      approvalThreshold: {
        type: Number,
        default: 50,
      },
      votingDuration: {
        type: Number,
        default: 72,
      },
      allowAbstention: {
        type: Boolean,
        default: true,
      },
    },
    stats: {
      totalContributions: {
        type: Number,
        default: 0,
      },
      totalExpenses: {
        type: Number,
        default: 0,
      },
      totalProposals: {
        type: Number,
        default: 0,
      },
      activeProposals: {
        type: Number,
        default: 0,
      },
    },
    settings: {
      isPrivate: {
        type: Boolean,
        default: false,
      },
      requireApprovalToJoin: {
        type: Boolean,
        default: true,
      },
      allowMemberProposals: {
        type: Boolean,
        default: true,
      },
      maxProposalsPerMonth: {
        type: Number,
        default: 10,
      },
    },
    avatar: {
      url: String,
      filename: String,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    archivedAt: Date,
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
GroupSchema.index({ 'members.userId': 1 });
GroupSchema.index({ createdAt: -1 });

export default mongoose.model<IGroup>('Group', GroupSchema);
