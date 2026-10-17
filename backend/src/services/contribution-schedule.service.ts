import type { IGroup } from "../models/Group";

export type ContributionSettings = IGroup["contributionSettings"];
const DAY = 86400000;
export const utcDay = (date: Date) =>
  new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );

function monthlyDate(year: number, month: number, day: number) {
  const last = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return new Date(Date.UTC(year, month, Math.min(day, last)));
}

/** Calendar dates use UTC. A monthly 31st falls on the month's last day. */
export function firstContributionDue(
  settings: ContributionSettings,
  createdAt: Date,
): Date {
  const start = utcDay(
    settings.firstDueAt ? new Date(settings.firstDueAt) : createdAt,
  );
  if (settings.frequency !== "monthly") return start;
  const day = settings.dueDay || start.getUTCDate();
  const candidate = monthlyDate(
    start.getUTCFullYear(),
    start.getUTCMonth(),
    day,
  );
  return candidate < start
    ? monthlyDate(start.getUTCFullYear(), start.getUTCMonth() + 1, day)
    : candidate;
}

/** Advance directly past now: one consolidated reminder after downtime. */
export function nextContributionDue(
  settings: ContributionSettings,
  due: Date,
  now: Date,
): Date {
  if (settings.frequency === "monthly") {
    const day =
      settings.dueDay || new Date(settings.firstDueAt || due).getUTCDate();
    const candidate = monthlyDate(now.getUTCFullYear(), now.getUTCMonth(), day);
    return candidate > now
      ? candidate
      : monthlyDate(now.getUTCFullYear(), now.getUTCMonth() + 1, day);
  }
  const interval =
    settings.frequency === "weekly"
      ? 7
      : settings.frequency === "custom"
        ? settings.customIntervalDays
        : 1;
  if (!interval || !Number.isSafeInteger(interval) || interval < 1)
    throw new Error("Intervalle de cotisation invalide");
  return new Date(
    due.getTime() +
      (Math.floor((now.getTime() - due.getTime()) / (interval * DAY)) + 1) *
        interval *
        DAY,
  );
}
