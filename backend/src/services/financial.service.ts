import { enqueueEvent } from "./events.service";
import mongoose, { ClientSession } from "mongoose";
import { Group, Transaction, Proposal } from "../models";
import { activeMember } from "../utils/membership";
import { ITransaction } from "../models/Transaction";
export class BusinessError extends Error {
  constructor(
    public status: number,
    message: string,
    public code = "BUSINESS_RULE",
  ) {
    super(message);
  }
}
export async function atomic<T>(
  work: (session: ClientSession) => Promise<T>,
): Promise<T> {
  const hello = await mongoose.connection.db?.admin().command({ hello: 1 });
  if (!hello?.setName && hello?.msg !== "isdbgrid")
    throw new BusinessError(
      503,
      "Les opérations financières sont temporairement indisponibles. Contactez le support.",
      "FINANCIAL_STORAGE_UNAVAILABLE",
    );
  const session = await mongoose.startSession();
  try {
    return (await session.withTransaction(() => work(session), {
      readConcern: { level: "snapshot" },
      writeConcern: { w: "majority" },
    })) as T;
  } finally {
    await session.endSession();
  }
}
function checkedSum(current: number, delta: number, factor: number): number {
  const currentMinor = Math.round(current * factor);
  const deltaMinor = Math.round(delta * factor);
  const next = currentMinor + deltaMinor;
  if (
    !Number.isSafeInteger(currentMinor) ||
    !Number.isSafeInteger(deltaMinor) ||
    !Number.isSafeInteger(next) ||
    Math.abs(current * factor - currentMinor) > 1e-6
  )
    throw new BusinessError(409, "Montant hors des limites comptables");
  return next / factor;
}
export async function account(
  tx: ITransaction,
  actor: string,
  session: ClientSession,
) {
  const group = await Group.findById(tx.groupId).session(session);
  if (!group) throw new BusinessError(404, "Groupe introuvable");
  const member = activeMember(group, actor);
  if (!member || !["admin", "treasurer"].includes(member.role))
    throw new BusinessError(403, "Validation réservée aux responsables actifs");
  if (tx.currency !== group.currency)
    throw new BusinessError(409, "La devise diffère de celle du groupe");
  if (tx.status === "completed") return tx;
  if (tx.status !== "pending")
    throw new BusinessError(409, "Opération non validable");
  const factor = ["XOF", "XAF", "GNF"].includes(tx.currency) ? 1 : 100;
  if (
    !Number.isSafeInteger(Math.round(tx.amount * factor)) ||
    Math.abs(tx.amount * factor - Math.round(tx.amount * factor)) > 1e-6 ||
    !Number.isFinite(tx.amount) ||
    tx.amount <= 0
  )
    throw new BusinessError(400, "Montant strictement positif requis");
  // Refund is an outgoing reimbursement; adjustments cannot silently mint funds.
  if (tx.type === "adjustment")
    throw new BusinessError(
      400,
      "Utilisez une cotisation ou un remboursement documenté",
    );
  const incoming = tx.type === "contribution";
  if (!incoming && group.balance < tx.amount)
    throw new BusinessError(409, "Solde insuffisant", "INSUFFICIENT_BALANCE");
  group.balance = checkedSum(
    group.balance,
    incoming ? tx.amount : -tx.amount,
    factor,
  );
  if (incoming) {
    group.stats.totalContributions = checkedSum(
      group.stats.totalContributions,
      tx.amount,
      factor,
    );
    const contributor = group.members.find(
      (m) => String(m.userId) === String(tx.initiatedBy),
    );
    if (contributor) {
      contributor.totalContributed = checkedSum(
        contributor.totalContributed,
        tx.amount,
        factor,
      );
      contributor.lastContributionAt = new Date();
    }
  } else
    group.stats.totalExpenses = checkedSum(
      group.stats.totalExpenses,
      tx.amount,
      factor,
    );
  tx.status = "completed";
  tx.processedAt = new Date();
  tx.validatedAt = tx.processedAt;
  tx.validatedBy = new mongoose.Types.ObjectId(actor);
  tx.auditTrail.push({
    action: "validated",
    actor: tx.validatedBy,
    at: tx.processedAt,
  });
  await group.save({ session });
  await tx.save({ session });
  await enqueueEvent(
    `transaction:${tx.id}:completed`,
    group._id,
    incoming ? "contribution_received" : "expense_executed",
    incoming ? "Cotisation validée" : "Dépense exécutée",
    `${tx.amount} ${group.currency} — ${group.name}`,
    {
      transactionId: tx._id,
      amount: tx.amount,
      proposalId: tx.metadata?.proposalId,
    },
    session,
  );
  return tx;
}
export async function validateFinancialTransaction(
  id: string,
  actor: string,
  notes?: string,
) {
  return atomic(async (session) => {
    const tx = await Transaction.findById(id).session(session);
    if (!tx) throw new BusinessError(404, "Opération introuvable");
    if (notes && tx.status === "pending")
      tx.metadata = { ...tx.metadata, notes };
    return account(tx, actor, session);
  });
}
export async function executeFinancialProposal(id: string, actor: string) {
  return atomic(async (session) => {
    const proposal = await Proposal.findById(id).session(session);
    if (!proposal) throw new BusinessError(404, "Proposition introuvable");
    const group = await Group.findById(proposal.groupId).session(session);
    const member = activeMember(group, actor);
    if (!member || !["admin", "treasurer"].includes(member.role))
      throw new BusinessError(403, "Responsable actif requis");
    if (proposal.status === "executed" && proposal.transactionId)
      return proposal;
    if (proposal.status !== "approved")
      throw new BusinessError(409, "Proposition non approuvée");
    const tx = new Transaction({
      groupId: proposal.groupId,
      type: "expense",
      amount: proposal.amount,
      currency: proposal.currency,
      description: proposal.title,
      recipient: proposal.recipient,
      initiatedBy: actor,
      metadata: { proposalId: proposal._id },
      status: "pending",
    });
    await account(tx, actor, session);
    proposal.status = "executed";
    proposal.executedAt = new Date();
    proposal.transactionId = tx._id as mongoose.Types.ObjectId;
    await proposal.save({ session });
    return proposal;
  });
}
