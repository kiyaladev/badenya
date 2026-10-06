import mongoose, { Document, Schema } from 'mongoose';

export interface ITransaction extends Document {
  groupId: mongoose.Types.ObjectId;
  type: 'contribution' | 'expense' | 'refund' | 'adjustment';
  amount: number;
  currency: string;
  description?: string;
  category?: string;
  initiatedBy: mongoose.Types.ObjectId;
  recipient?: {
    userId?: mongoose.Types.ObjectId;
    name?: string;
    details?: string;
  };
  paymentMethod?: {
    type: 'cash' | 'mobile_money' | 'bank_transfer' | 'card';
    provider?: string;
    reference?: string;
  };
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  metadata?: {
    proposalId?: mongoose.Types.ObjectId;
    voteId?: mongoose.Types.ObjectId;
    notes?: string;
  };
  attachments?: Array<{
    type: 'image' | 'document' | 'receipt';
    url: string;
    filename: string;
    name: string;
  }>;
  flagged?: { reason: string; at: Date; by: mongoose.Types.ObjectId };
  idempotencyKey?: string;
  requestFingerprint?: string;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema: Schema = new Schema(
  {
    groupId: {
      type: Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['contribution', 'expense', 'refund', 'adjustment'],
      required: true,
      index: true,
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
    description: {
      type: String,
      maxlength: 500,
    },
    category: String,
    initiatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recipient: {
      userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      name: String,
      details: String,
    },
    paymentMethod: {
      type: {
        type: String,
        enum: ['cash', 'mobile_money', 'bank_transfer', 'card'],
      },
      provider: String,
      reference: String,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    metadata: {
      proposalId: {
        type: Schema.Types.ObjectId,
        ref: 'Proposal',
      },
      voteId: Schema.Types.ObjectId,
      notes: String,
    },
    attachments: [
      {
        type: {
          type: String,
          enum: ['image', 'document', 'receipt'],
        },
        url: String,
        filename: String,
        name: String,
      },
    ],
    flagged: { reason: String, at: Date, by: {type: Schema.Types.ObjectId, ref: 'User'} },
    idempotencyKey: String,
    requestFingerprint: String,
    processedAt: Date,
  },
  {
    timestamps: true,
  }
);

TransactionSchema.index({groupId:1, initiatedBy:1, idempotencyKey:1}, {unique:true, partialFilterExpression:{idempotencyKey:{$type:'string'}}});
// Indexes
TransactionSchema.index({ groupId: 1, createdAt: -1 });
TransactionSchema.index({ initiatedBy: 1 });

export default mongoose.model<ITransaction>('Transaction', TransactionSchema);
