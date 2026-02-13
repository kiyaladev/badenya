import mongoose, { Document, Schema } from 'mongoose';

export interface IAIReport extends Document {
  groupId: mongoose.Types.ObjectId;
  generatedBy: mongoose.Types.ObjectId;
  periodStart: Date;
  periodEnd: Date;
  transactionsAnalyzed: number;
  report: {
    summary: string;
    totalContributions: number;
    totalExpenses: number;
    netBalance: number;
    insights: Array<{
      category: string;
      observation: string;
      recommendation: string;
    }>;
    trends: Array<{
      metric: string;
      value: number;
      change: number;
      direction: 'up' | 'down' | 'stable';
    }>;
    predictions: Array<{
      timeframe: string;
      metric: string;
      predictedValue: number;
      confidence: number;
    }>;
  };
  modelUsed: string;
  tokensUsed?: number;
  createdAt: Date;
}

const AIReportSchema: Schema = new Schema(
  {
    groupId: {
      type: Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
      index: true,
    },
    generatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    periodStart: {
      type: Date,
      required: true,
    },
    periodEnd: {
      type: Date,
      required: true,
    },
    transactionsAnalyzed: {
      type: Number,
      default: 0,
    },
    report: {
      summary: {
        type: String,
        required: true,
      },
      totalContributions: Number,
      totalExpenses: Number,
      netBalance: Number,
      insights: [
        {
          category: String,
          observation: String,
          recommendation: String,
        },
      ],
      trends: [
        {
          metric: String,
          value: Number,
          change: Number,
          direction: {
            type: String,
            enum: ['up', 'down', 'stable'],
          },
        },
      ],
      predictions: [
        {
          timeframe: String,
          metric: String,
          predictedValue: Number,
          confidence: Number,
        },
      ],
    },
    modelUsed: {
      type: String,
      required: true,
    },
    tokensUsed: Number,
  },
  {
    timestamps: true,
  }
);

// Indexes
AIReportSchema.index({ groupId: 1, createdAt: -1 });

export default mongoose.model<IAIReport>('AIReport', AIReportSchema);
