import { Group } from "../models";
import { enqueueEvent } from "./events.service";
import {
  firstContributionDue,
  nextContributionDue,
} from "./contribution-schedule.service";
import logger from "../utils/logger";

export async function sendDueReminders(now = new Date()) {
  const groups = Group.find({
    isActive: true,
    archivedAt: { $exists: false },
    "contributionSettings.autoReminder": true,
    "contributionSettings.amount": { $gt: 0 },
    $or: [
      { "contributionSettings.nextDueAt": { $lte: now } },
      { "contributionSettings.nextDueAt": { $exists: false } },
    ],
  }).cursor();
  for await (const group of groups) {
    try {
      const settings = group.contributionSettings;
      const due =
        settings.nextDueAt || firstContributionDue(settings, group.createdAt);
      const next =
        due > now
          ? due
          : nextContributionDue(
              {
                ...settings,
                firstDueAt: settings.firstDueAt || group.createdAt,
              },
              due,
              now,
            );
      if (due <= now)
        await enqueueEvent(
          `reminder:${group.id}:${due.toISOString().slice(0, 10)}`,
          group._id,
          "payment_reminder",
          "Rappel de cotisation",
          `${settings.amount} ${group.currency} — ${group.name}`,
          { dueAt: due.toISOString() },
        );
      // Revision condition prevents a worker overwriting a concurrent settings edit.
      await Group.updateOne(
        {
          _id: group._id,
          __v: group.get("__v"),
          "contributionSettings.nextDueAt": settings.nextDueAt || {
            $exists: false,
          },
        },
        { $set: { "contributionSettings.nextDueAt": next } },
      );
    } catch (error) {
      logger.warn("Contribution reminder failed", {
        groupId: group.id,
        error: error instanceof Error ? error.message : "unknown",
      });
    }
  }
}
