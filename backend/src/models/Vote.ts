import mongoose, { Document, Schema } from 'mongoose';

export interface IVote extends Document {
  groupId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  createdBy: mongoose.Types.ObjectId;
  
  // Voting configuration
  type: 'simple' | 'quorum' | 'unanimous'; // Type de vote
  quorumPercentage?: number; // Pourcentage requis (pour quorum)
  options: Array<{
    id: string;
    label: string;
    votes: number;
  }>;
  
  // Voting data
  votes: Array<{
    userId: mongoose.Types.ObjectId;
    optionId: string;
    comment?: string;
    votedAt: Date;
  }>;
  
  // Timing
  startDate: Date;
  endDate: Date;
  
  // Status
  status: 'pending' | 'active' | 'closed' | 'executed';
  
  // Results
  result?: {
    winningOptionId?: string;
    totalVotes: number;
    participationRate: number;
    votesPerOption: Map<string, number>;
    decidedAt: Date;
  };
  
  // Governance rules
  allowChangeVote: boolean; // Permettre de changer son vote
  anonymousVoting: boolean; // Vote anonyme
  showIntermediateResults: boolean; // Afficher les résultats intermédiaires
  
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  calculateResults(eligibleMembers?: number): {
    winningOptionId?: string;
    totalVotes: number;
    participationRate: number;
    votesPerOption: Map<string, number>;
    decidedAt: Date;
  };
  closeVote(eligibleMembers?: number): Promise<IVote>;
  hasUserVoted(userId: string): boolean;
  canUserVote(userId: string): boolean;
}

const VoteSchema: Schema = new Schema(
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
    },
    description: {
      type: String,
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['simple', 'quorum', 'unanimous'],
      default: 'simple',
    },
    quorumPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 50,
    },
    options: [
      {
        id: {
          type: String,
          required: true,
        },
        label: {
          type: String,
          required: true,
        },
        votes: {
          type: Number,
          default: 0,
        },
      },
    ],
    votes: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        optionId: {
          type: String,
          required: true,
        },
        comment: String,
        votedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'closed', 'executed'],
      default: 'active',
    },
    result: {
      winningOptionId: String,
      totalVotes: Number,
      participationRate: Number,
      votesPerOption: {
        type: Map,
        of: Number,
      },
      decidedAt: Date,
    },
    allowChangeVote: {
      type: Boolean,
      default: true,
    },
    anonymousVoting: {
      type: Boolean,
      default: false,
    },
    showIntermediateResults: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    optimisticConcurrency: true,
  }
);

// Indexes
VoteSchema.index({ groupId: 1, status: 1 });
VoteSchema.index({ endDate: 1 });
VoteSchema.index({ 'votes.userId': 1 });

// Methods
VoteSchema.methods.calculateResults = function (eligibleMembers = 0) {
  const vote = this as IVote;
  const votesPerOption = new Map<string, number>(vote.options.map(option => [option.id, 0]));
  for (const ballot of vote.votes) {
    if (votesPerOption.has(ballot.optionId)) votesPerOption.set(ballot.optionId, (votesPerOption.get(ballot.optionId) || 0) + 1);
  }
  const totalVotes = [...votesPerOption.values()].reduce((sum, count) => sum + count, 0);
  const participationRate = eligibleMembers > 0 ? Math.min(100, totalVotes / eligibleMembers * 100) : 0;
  const maxVotes = Math.max(0, ...votesPerOption.values());
  const leaders = [...votesPerOption].filter(([, count]) => count === maxVotes && count > 0);
  let winningOptionId = leaders.length === 1 ? leaders[0][0] : undefined;
  if (vote.type === 'quorum' && participationRate < (vote.quorumPercentage ?? 50)) winningOptionId = undefined;
  if (vote.type === 'unanimous' && (eligibleMembers === 0 || totalVotes !== eligibleMembers || maxVotes !== eligibleMembers)) winningOptionId = undefined;
  return { winningOptionId, totalVotes, participationRate, votesPerOption, decidedAt: new Date() };
};

VoteSchema.methods.closeVote = async function (eligibleMembers = 0) {
  const vote = this as IVote;
  if (vote.status === 'closed' || vote.status === 'executed') return vote;
  vote.status = 'closed';
  vote.result = vote.calculateResults(eligibleMembers);
  vote.options.forEach(option => { option.votes = vote.result?.votesPerOption.get(option.id) || 0; });
  return vote.save();
};

VoteSchema.methods.hasUserVoted = function (userId: string): boolean {
  const vote = this as IVote;
  return vote.votes.some((v) => v.userId.toString() === userId);
};

VoteSchema.methods.canUserVote = function (userId: string): boolean {
  const vote = this as IVote;
  
  // Check if vote is active
  if (vote.status !== 'active') return false;
  
  // Check if voting period is valid
  const now = new Date();
  if (now < vote.startDate || now >= vote.endDate) return false;
  
  // Check if user already voted and can't change
  if (this.hasUserVoted(userId) && !vote.allowChangeVote) return false;
  
  return true;
};

export default mongoose.model<IVote>('Vote', VoteSchema);
