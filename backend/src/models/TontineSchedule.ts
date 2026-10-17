import mongoose, { Schema } from "mongoose";
export interface Round {
  roundId: string;
  roundNumber: number;
  beneficiaryId: string;
  beneficiaryName: string;
  payoutDate: string;
  potAmount: number;
  status: "completed" | "current" | "upcoming";
  paidAt?: string;
  payoutTransactionId?: string;
}
export interface Schedule {
  groupId: mongoose.Types.ObjectId;
  revision: number;
  cycleNumber: number;
  totalRounds: number;
  currentRoundNumber: number;
  contributionAmount: number;
  potAmount: number;
  frequency: "daily" | "weekly" | "monthly" | "custom";
  customIntervalDays?: number;
  rounds: Round[];
  updatedAt: Date;
}
export const scheduleSchema = new Schema<Schedule>(
  {
    groupId: { type: Schema.Types.ObjectId, required: true, unique: true },
    revision: { type: Number, default: 0 },
    cycleNumber: { type: Number, default: 1 },
    totalRounds: Number,
    currentRoundNumber: Number,
    contributionAmount: Number,
    potAmount: Number,
    frequency: { type: String, enum: ["daily", "weekly", "monthly", "custom"] },
    customIntervalDays: Number,
    rounds: [
      {
        _id: false,
        roundId: String,
        roundNumber: Number,
        beneficiaryId: String,
        beneficiaryName: String,
        payoutDate: String,
        potAmount: Number,
        status: { type: String, enum: ["completed", "current", "upcoming"] },
        paidAt: String,
        payoutTransactionId: String,
      },
    ],
  },
  { timestamps: true },
);
export default mongoose.model<Schedule>("TontineSchedule", scheduleSchema);
