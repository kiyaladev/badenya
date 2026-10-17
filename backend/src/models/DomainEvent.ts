import mongoose, { Schema } from "mongoose";
const schema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    groupId: { type: Schema.Types.ObjectId, required: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    data: Schema.Types.Mixed,
    deliveredAt: Date,
    nextAttemptAt: Date,
  },
  { timestamps: true },
);
export default mongoose.model("DomainEvent", schema);
