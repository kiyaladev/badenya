import { ClientSession } from "mongoose";
import DomainEvent from "../models/DomainEvent";
import { Group, Notification } from "../models";
import { NotificationType } from "../models/Notification";
import { sendPushNotification } from "./notification.service";
export async function enqueueEvent(
  key: string,
  groupId: unknown,
  type: NotificationType,
  title: string,
  message: string,
  data: Record<string, unknown> = {},
  session?: ClientSession,
) {
  await DomainEvent.updateOne(
    { key },
    { $setOnInsert: { key, groupId, type, title, message, data } },
    { upsert: true, session },
  );
}
export async function deliverEvents() {
  const now = new Date();
  const events = await DomainEvent.find({
    deliveredAt: { $exists: false },
    $or: [
      { nextAttemptAt: { $exists: false } },
      { nextAttemptAt: { $lte: now } },
    ],
  })
    .sort({ createdAt: 1 })
    .limit(100);
  for (const event of events) {
    let pending = false;
    try {
      const group = await Group.findById(event.groupId);
      if (!group) {
        await DomainEvent.updateOne(
          { _id: event._id },
          { $set: { deliveredAt: new Date() } },
        );
        continue;
      }
      for (const member of group.members.filter((m) => m.status === "active")) {
        try {
          const key = `${event.key}:${member.userId}`;
          const created = await Notification.findOneAndUpdate(
            { eventKey: key },
            {
              $setOnInsert: {
                eventKey: key,
                userId: member.userId,
                type: event.type,
                title: event.title,
                message: event.message,
                data: { ...event.data, groupId: group._id },
              },
            },
            { upsert: true, new: true },
          );
          if (!created) {
            pending = true;
            continue;
          }
          const claimed = await Notification.findOneAndUpdate(
            {
              _id: created._id,
              pushDeliveredAt: { $exists: false },
              $or: [
                { pushLeaseUntil: { $exists: false } },
                { pushLeaseUntil: { $lt: new Date() } },
              ],
            },
            { $set: { pushLeaseUntil: new Date(Date.now() + 300000) } },
            { new: true },
          );
          if (!claimed) {
            if (!created.get("pushDeliveredAt")) pending = true;
            continue;
          }
          let complete = true;
          for (const [channel, field] of [
            ["expo", "pushExpoDeliveredAt"],
            ["fcm", "pushFcmDeliveredAt"],
          ] as const) {
            if (claimed.get(field)) continue;
            const sent = await sendPushNotification(
              member.userId,
              claimed,
              channel,
            );
            if (sent)
              await Notification.updateOne(
                { _id: claimed._id },
                { $set: { [field]: new Date() } },
              );
            else complete = false;
          }
          if (complete)
            await Notification.updateOne(
              { _id: claimed._id },
              {
                $set: { pushDeliveredAt: new Date() },
                $unset: { pushLeaseUntil: 1 },
              },
            );
          else {
            pending = true;
            await Notification.updateOne(
              { _id: claimed._id },
              { $set: { pushLeaseUntil: new Date(Date.now() + 600000) } },
            );
          }
        } catch {
          pending = true;
        }
      }
    } catch {
      pending = true;
    }
    await DomainEvent.updateOne(
      { _id: event._id },
      {
        $set: pending
          ? { nextAttemptAt: new Date(Date.now() + 600000) }
          : { deliveredAt: new Date() },
      },
    );
  }
}
