import mongoose, { Schema } from "mongoose";

const schema = new Schema(
  {
    filename: { type: String, required: true, unique: true },
    ownerId: { type: Schema.Types.ObjectId, required: true, index: true },
    groupId: Schema.Types.ObjectId,
    visibility: { type: String, enum: ["public", "private"], required: true },
    size: { type: Number, required: true },
    mimeType: { type: String, required: true },
  },
  { timestamps: true },
);
schema.index({ createdAt: 1 });
export default mongoose.model("UploadedFile", schema);

const quotaSchema = new Schema({
  _id: { type: Schema.Types.ObjectId, required: true },
  bytes: { type: Number, default: 0 },
});
export const UploadQuota = mongoose.model("UploadQuota", quotaSchema);
