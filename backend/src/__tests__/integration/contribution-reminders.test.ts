import { Group } from "../../models";
import DomainEvent from "../../models/DomainEvent";
import { financialFixture } from "../helpers/financial-fixture";
import { sendDueReminders } from "../../services/reminder.service";
import {
  firstContributionDue,
  nextContributionDue,
} from "../../services/contribution-schedule.service";
const f = financialFixture();
const settings = {
  frequency: "monthly" as const,
  amount: 100,
  autoReminder: true,
  dueDay: 31,
  firstDueAt: new Date("2026-01-31"),
};
it("uses month end without permanently shifting a 31st to the 28th", () => {
  expect(
    firstContributionDue(settings, new Date("2026-01-01"))
      .toISOString()
      .slice(0, 10),
  ).toBe("2026-01-31");
  const february = nextContributionDue(
    settings,
    new Date("2026-01-31"),
    new Date("2026-01-31T10:00:00Z"),
  );
  expect(february.toISOString().slice(0, 10)).toBe("2026-02-28");
  expect(
    nextContributionDue(settings, february, new Date("2026-02-28T10:00:00Z"))
      .toISOString()
      .slice(0, 10),
  ).toBe("2026-03-31");
});
it.each([
  ["daily", undefined, "2026-03-17"],
  ["weekly", undefined, "2026-03-23"],
  ["custom", 10, "2026-03-22"],
] as const)(
  "advances %s from its anchor past missed deadlines",
  (frequency, customIntervalDays, expected) => {
    const next = nextContributionDue(
      { ...settings, frequency, customIntervalDays },
      new Date("2026-03-02"),
      new Date("2026-03-16T10:00:00Z"),
    );
    expect(next.toISOString().slice(0, 10)).toBe(expected);
  },
);
it("persists a single catch-up event and the next deadline across retries", async () => {
  await Group.updateOne(
    { _id: f.groupId },
    {
      $set: {
        contributionSettings: {
          ...settings,
          nextDueAt: new Date("2026-01-31"),
        },
      },
    },
  );
  await DomainEvent.init();
  await sendDueReminders(new Date("2026-04-04"));
  await sendDueReminders(new Date("2026-04-04"));
  expect(await DomainEvent.countDocuments({ type: "payment_reminder" })).toBe(
    1,
  );
  expect(
    (await Group.findById(f.groupId))?.contributionSettings.nextDueAt
      ?.toISOString()
      .slice(0, 10),
  ).toBe("2026-04-30");
  const event = await DomainEvent.findOne({ type: "payment_reminder" });
  expect(event?.data.dueAt).toBe("2026-01-31T00:00:00.000Z");
});
it("does not remind archived or disabled groups and leaves future deadlines unchanged", async () => {
  await Group.updateOne(
    { _id: f.groupId },
    {
      $set: {
        "contributionSettings.amount": 100,
        "contributionSettings.nextDueAt": new Date("2026-12-01"),
      },
    },
  );
  await sendDueReminders(new Date("2026-04-04"));
  expect(await DomainEvent.countDocuments()).toBe(0);
  await Group.updateOne(
    { _id: f.groupId },
    {
      $set: {
        archivedAt: new Date(),
        "contributionSettings.nextDueAt": new Date("2026-01-01"),
      },
    },
  );
  await sendDueReminders(new Date("2026-04-04"));
  expect(await DomainEvent.countDocuments()).toBe(0);
});
it("requires a custom interval and preserves the next due date when only the amount changes", async () => {
  const request = (await import("supertest")).default;
  await request(f.app)
    .put(`/api/v1/groups/${f.groupId}`)
    .set(f.auth())
    .send({ contributionSettings: { frequency: "custom" } })
    .expect(400);
  const saved = await request(f.app)
    .put(`/api/v1/groups/${f.groupId}`)
    .set(f.auth())
    .send({
      contributionSettings: {
        frequency: "custom",
        customIntervalDays: 10,
        firstDueAt: "2026-01-01",
      },
    })
    .expect(200);
  expect(saved.body.data.group.contributionSettings.customIntervalDays).toBe(
    10,
  );
  await sendDueReminders(new Date("2026-04-04"));
  const before = (
    await Group.findById(f.groupId)
  )?.contributionSettings.nextDueAt?.toISOString();
  await request(f.app)
    .put(`/api/v1/groups/${f.groupId}`)
    .set(f.auth())
    .send({ contributionSettings: { amount: 200 } })
    .expect(200);
  expect(
    (
      await Group.findById(f.groupId)
    )?.contributionSettings.nextDueAt?.toISOString(),
  ).toBe(before);
});
