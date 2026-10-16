import { Request, Response } from "express";
import crypto from "crypto";
import { Group, Transaction } from "../models";
import TontineSchedule, { Round } from "../models/TontineSchedule";
import { AuthRequest } from "../middleware/auth";
import { activeMember, entityId } from "../utils/membership";
import { atomic, account, BusinessError } from "../services/financial.service";
const failure = (res: Response, error: unknown) => {
  if (error instanceof BusinessError)
    res
      .status(error.status)
      .json({ status: "error", code: error.code, message: error.message });
  else
    res.status(500).json({ status: "error", message: "Échec du calendrier" });
};
async function access(req: Request, manager = false) {
  const group = await Group.findById(req.params.id).populate(
    "members.userId",
    "fullName",
  );
  const user = (req as AuthRequest).user;
  if (!user) throw new BusinessError(401, "Session requise");
  if (!group) throw new BusinessError(404, "Groupe introuvable");
  const member = activeMember(group, user.id);
  if (!member || (manager && !["admin", "treasurer"].includes(member.role)))
    throw new BusinessError(403, "Responsable ou membre actif requis");
  if (group.type !== "tontine")
    throw new BusinessError(400, "Ce groupe n’est pas une tontine");
  return group;
}
function dateAt(start: Date, index: number, frequency: string, custom = 0) {
  const date = new Date(start);
  if (frequency === "monthly") {
    const day = start.getUTCDate();
    date.setUTCDate(1);
    date.setUTCMonth(date.getUTCMonth() + index);
    const end = new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0),
    ).getUTCDate();
    date.setUTCDate(Math.min(day, end));
  } else
    date.setUTCDate(
      date.getUTCDate() +
        index *
          (frequency === "weekly" ? 7 : frequency === "custom" ? custom : 1),
    );
  return date.toISOString();
}
export async function getSchedule(req: Request, res: Response) {
  try {
    const group = await access(req);
    let schedule = await TontineSchedule.findOne({ groupId: group._id });
    if (!schedule) {
      const members = group.members.filter((m) => m.status === "active");
      const amount = group.contributionSettings.amount || 0;
      const frequency = group.contributionSettings.frequency || "monthly";
      if (frequency === "custom") {
        res.json({ status: "success", data: { schedule: null } });
        return;
      }
      const rounds: Round[] = members.map((m, index) => ({
        roundId: crypto.randomUUID(),
        roundNumber: index + 1,
        beneficiaryId: entityId(m.userId),
        beneficiaryName:
          (m.userId as unknown as { fullName: string }).fullName || "Membre",
        payoutDate: dateAt(new Date(), index, frequency),
        potAmount: amount * members.length,
        status: index === 0 ? "current" : "upcoming",
      }));
      schedule = await TontineSchedule.findOneAndUpdate(
        { groupId: group._id },
        {
          $setOnInsert: {
            groupId: group._id,
            revision: 0,
            cycleNumber: 1,
            totalRounds: rounds.length,
            currentRoundNumber: 1,
            contributionAmount: amount,
            potAmount: amount * members.length,
            frequency,
            rounds,
          },
        },
        { upsert: true, new: true },
      );
    }
    res.json({ status: "success", data: { schedule } });
  } catch (error) {
    failure(res, error);
  }
}
export async function putSchedule(req: Request, res: Response) {
  try {
    const group = await access(req, true);
    const existing = await TontineSchedule.findOne({ groupId: group._id });
    const body = req.body;
    if (
      !["daily", "weekly", "monthly", "custom"].includes(body.frequency) ||
      !Number.isFinite(body.contributionAmount) ||
      body.contributionAmount <= 0 ||
      !Number.isFinite(body.potAmount) ||
      body.potAmount <= 0
    )
      throw new BusinessError(400, "Fréquence et montants positifs requis");
    if (
      !Array.isArray(body.rounds) ||
      body.rounds.length === 0 ||
      body.rounds.length > 500
    )
      throw new BusinessError(400, "Tours requis");
    if (
      body.frequency === "custom" &&
      (!Number.isInteger(body.customIntervalDays) ||
        body.customIntervalDays < 1)
    )
      throw new BusinessError(400, "Intervalle personnalisé requis");
    const activeIds = new Set(
      group.members
        .filter((m) => m.status === "active")
        .map((m) => entityId(m.userId)),
    );
    const seen = new Set<string>();
    const rounds: Round[] = body.rounds.map((r: Round, index: number) => {
      const old = existing?.rounds.find((o) => o.roundId === r.roundId);
      if (!activeIds.has(r.beneficiaryId) || seen.has(r.beneficiaryId))
        throw new BusinessError(400, "Bénéficiaires actifs et uniques requis");
      seen.add(r.beneficiaryId);
      if (old?.status === "completed") {
        if (
          old.roundNumber !== index + 1 ||
          old.beneficiaryId !== r.beneficiaryId
        )
          throw new BusinessError(409, "Tour versé immuable");
        const oldDoc = old as unknown as { toObject?: () => Round };
        const oldObj =
          typeof oldDoc.toObject === "function"
            ? oldDoc.toObject()
            : old;
        return {
          roundId: old.roundId,
          roundNumber: index + 1,
          beneficiaryId: old.beneficiaryId,
          beneficiaryName: old.beneficiaryName,
          payoutDate:
            typeof old.payoutDate === "string"
              ? old.payoutDate
              : new Date(old.payoutDate).toISOString(),
          potAmount: old.potAmount,
          status: "completed",
          paidAt: oldObj.paidAt,
          payoutTransactionId: oldObj.payoutTransactionId,
        };
      }
      if (
        !Number.isFinite(r.potAmount) ||
        r.potAmount <= 0 ||
        Number.isNaN(Date.parse(r.payoutDate))
      )
        throw new BusinessError(400, "Montant et date valides requis");
      return {
        roundId: old?.roundId || crypto.randomUUID(),
        roundNumber: index + 1,
        beneficiaryId: r.beneficiaryId,
        beneficiaryName: r.beneficiaryName,
        payoutDate: new Date(r.payoutDate).toISOString(),
        potAmount: r.potAmount,
        status: "upcoming",
      };
    });
    if (
      existing &&
      existing.rounds.some(
        (r) =>
          r.status === "completed" &&
          !rounds.some((n) => n.roundId === r.roundId),
      )
    )
      throw new BusinessError(409, "Tour versé conservé obligatoire");
    const current = rounds.find((r) => r.status !== "completed");
    if (current) current.status = "current";
    const fields = {
      rounds,
      cycleNumber: existing?.cycleNumber || 1,
      totalRounds: rounds.length,
      currentRoundNumber: current?.roundNumber || 0,
      contributionAmount: body.contributionAmount,
      potAmount: body.potAmount,
      frequency: body.frequency,
      customIntervalDays: body.customIntervalDays,
    };
    let schedule;
    if (existing) {
      if (body.revision !== existing.revision)
        throw new BusinessError(409, "Calendrier modifié : rechargez-le");
      schedule = await TontineSchedule.findOneAndUpdate(
        { _id: existing._id, revision: body.revision },
        { $set: fields, $inc: { revision: 1 } },
        { new: true, runValidators: true },
      );
      if (!schedule) throw new BusinessError(409, "Calendrier modifié");
    } else
      schedule = await TontineSchedule.create({
        ...fields,
        groupId: group._id,
        revision: 0,
      });
    res.json({ status: "success", data: { schedule } });
  } catch (error) {
    failure(res, error);
  }
}
export async function payout(req: Request, res: Response) {
  try {
    await access(req, true);
    const user = (req as AuthRequest).user;
    if (!user) throw new BusinessError(401, "Session requise");
    const actor = user.id;
    const schedule = await atomic(async (session) => {
      const saved = await TontineSchedule.findOne({
        groupId: req.params.id,
      }).session(session);
      if (!saved) throw new BusinessError(404, "Calendrier introuvable");
      const round = saved.rounds.find((r) => r.roundId === req.body.roundId);
      if (!round) throw new BusinessError(404, "Tour introuvable");
      if (round.status === "completed") return saved;
      if (round.status !== "current")
        throw new BusinessError(409, "Versez le tour courant");
      const group = await Group.findById(saved.groupId).session(session);
      if (!group) throw new BusinessError(404, "Groupe introuvable");
      if (!activeMember(group, round.beneficiaryId))
        throw new BusinessError(409, "Bénéficiaire inactif");
      const tx = new Transaction({
        groupId: saved.groupId,
        type: "expense",
        amount: round.potAmount,
        currency: group.currency,
        description: `Tontine — cycle ${saved.cycleNumber}, tour ${round.roundNumber}`,
        initiatedBy: actor,
        recipient: { userId: round.beneficiaryId, name: round.beneficiaryName },
        idempotencyKey: `tontine:${saved.groupId}:${saved.cycleNumber}:${round.roundId}`,
        status: "pending",
      });
      await account(tx, actor, session);
      round.status = "completed";
      round.paidAt = new Date().toISOString();
      round.payoutTransactionId = tx.id;
      const next = saved.rounds.find((r) => r.status === "upcoming");
      if (next) next.status = "current";
      saved.currentRoundNumber = next?.roundNumber || 0;
      saved.revision += 1;
      await saved.save({ session });
      return saved;
    });
    res.json({ status: "success", data: { schedule } });
  } catch (error) {
    failure(res, error);
  }
}

/** Preserve the completed cycle before creating the next shared calendar. */
export async function nextCycle(req: Request, res: Response) {
  try {
    await access(req, true);
    const schedule = await atomic(async (session) => {
      const saved = await TontineSchedule.findOne({
        groupId: req.params.id,
      }).session(session);
      if (
        !saved ||
        saved.rounds.length === 0 ||
        saved.rounds.some((round) => round.status !== "completed")
      )
        throw new BusinessError(
          409,
          "Terminez le cycle courant avant de démarrer le suivant",
        );
      const group = await Group.findById(saved.groupId)
        .populate("members.userId", "fullName")
        .session(session);
      const user = (req as AuthRequest).user;
      if (
        !group ||
        !user ||
        !["admin", "treasurer"].includes(
          activeMember(group, user.id)?.role || "",
        )
      )
        throw new BusinessError(403, "Responsable actif requis");
      const members = group.members.filter(
        (member) => member.status === "active",
      );
      const amount = group.contributionSettings.amount || 0;
      if (!members.length || !Number.isFinite(amount) || amount <= 0)
        throw new BusinessError(400, "Membres et cotisation positive requis");
      const frequency = group.contributionSettings.frequency || "monthly";
      const custom = saved.customIntervalDays;
      if (frequency === "custom" && (!custom || custom <= 0))
        throw new BusinessError(400, "Intervalle personnalisé requis");
      const lastDate = saved.rounds[saved.rounds.length - 1]?.payoutDate;
      const nextDate = lastDate
        ? new Date(dateAt(new Date(lastDate), 1, frequency, custom))
        : new Date();
      const start = nextDate > new Date() ? nextDate : new Date();
      saved.cycleNumber += 1;
      saved.revision += 1;
      saved.contributionAmount = amount;
      saved.potAmount = amount * members.length;
      saved.frequency = frequency;
      saved.totalRounds = members.length;
      saved.currentRoundNumber = 1;
      saved.rounds = members.map((member, index) => ({
        roundId: crypto.randomUUID(),
        roundNumber: index + 1,
        beneficiaryId: entityId(member.userId),
        beneficiaryName:
          (member.userId as unknown as { fullName: string }).fullName ||
          "Membre",
        payoutDate: dateAt(start, index, frequency, custom),
        potAmount: amount * members.length,
        status: index === 0 ? "current" : "upcoming",
      }));
      await saved.save({ session });
      return saved;
    });
    res.json({ status: "success", data: { schedule } });
  } catch (error) {
    failure(res, error);
  }
}
