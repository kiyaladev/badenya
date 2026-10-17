import mongoose from "mongoose";
import { Schedule, scheduleSchema } from "./TontineSchedule";

// A separate collection preserves the existing current-calendar API and index.
const schema = scheduleSchema.clone();
schema.remove("groupId");
schema.add({
  groupId: { type: mongoose.Schema.Types.ObjectId, required: true },
});
schema.index({ groupId: 1, cycleNumber: 1 }, { unique: true });
export default mongoose.model<Schedule>("TontineCycle", schema);
