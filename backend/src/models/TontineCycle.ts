import mongoose, { Schema } from "mongoose";
const schema = new Schema(
  {
    groupId: { type: Schema.Types.ObjectId, required: true },
    cycleNumber: { type: Number, required: true },
    schedule: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true },
);
schema.index({ groupId: 1, cycleNumber: 1 }, { unique: true });
export default mongoose.model("TontineCycle", schema);
