import crypto from 'crypto';
import mongoose, { Document, Schema } from 'mongoose';

export interface IGroup extends Document {
  invitationCode: string;
  joinRequests: Array<{_id: mongoose.Types.ObjectId;userId: mongoose.Types.ObjectId;requestedAt: Date}>;
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
    maxMembers: number;
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
    invitationCode: {type:String,default:()=>crypto.randomBytes(12).toString('hex'),index:true},
    joinRequests: [{userId:{type:Schema.Types.ObjectId,ref:'User'},requestedAt:{type:Date,default:Date.now}}],
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
      enum: ['XOF','XAF','EUR','USD','GNF','CDF','MAD'],
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
      amount: {type:Number,min:0,max:1000000000000},
      dueDay: {type:Number,min:1,max:31,validate:Number.isSafeInteger},
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
        min: 0, max: 100,
      },
      approvalThreshold: {
        type: Number,
        default: 50,
        min: 0, max: 100,
      },
      votingDuration: {
        type: Number,
        default: 72,
        min: 1, max: 8760,
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
      maxMembers: {type:Number,default:100,min:1,max:5000,validate:Number.isSafeInteger},
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
        min: 1, max: 1000,
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
    optimisticConcurrency: true,
  }
);

// Indexes
GroupSchema.index({ 'members.userId': 1 });
GroupSchema.index({ createdAt: -1 });

export default mongoose.model<IGroup>('Group', GroupSchema);
