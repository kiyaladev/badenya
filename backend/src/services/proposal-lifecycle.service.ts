import logger from "../utils/logger";
import { atomic, BusinessError } from "./financial.service";
import { Group, Proposal } from "../models";
import { activeMember, entityId } from "../utils/membership";
import { enqueueEvent } from "./events.service";
export async function decideProposal(id: string, actor?: string) {
  return atomic(async (session) => {
    const proposal = await Proposal.findById(id).session(session);
    if (!proposal) throw new BusinessError(404, "Proposition introuvable");
    const group = await Group.findById(proposal.groupId).session(session);
    if (!group || !group.isActive || group.archivedAt) {
      if (actor) throw new BusinessError(404, "Groupe indisponible");
      if (proposal.status === "pending") {
        proposal.status = "expired";
        await proposal.save({ session });
        if (group) {
          group.stats.activeProposals = Math.max(
            0,
            group.stats.activeProposals - 1,
          );
          await group.save({ session });
        }
      }
      return proposal;
    }
    if (actor) {
      const member = activeMember(group, actor);
      if (!member || !["admin", "treasurer"].includes(member.role))
        throw new BusinessError(403, "Responsable actif requis");
    }
    if (proposal.status !== "pending") return proposal;
    if (!actor && proposal.votingDeadline > new Date()) return proposal;
    const activeIds = new Set(
      group.members
        .filter((m) => m.status === "active")
        .map((m) => entityId(m.userId)),
    );
    const votes = proposal.votes.filter((v) =>
      activeIds.has(entityId(v.userId)),
    );
    const votesFor = votes.filter((v) => v.decision === "for").length;
    const votesAgainst = votes.filter((v) => v.decision === "against").length;
    const votesAbstain = votes.filter((v) => v.decision === "abstain").length;
    const participationRate = activeIds.size
      ? (votes.length / activeIds.size) * 100
      : 0;
    const decidedVotes = votesFor + votesAgainst;
    const approved =
      participationRate >= group.votingRules.quorum &&
      decidedVotes > 0 &&
      (votesFor / decidedVotes) * 100 >= group.votingRules.approvalThreshold;
    proposal.status = approved ? "approved" : "rejected";
    proposal.result = {
      totalVotes: votes.length,
      votesFor,
      votesAgainst,
      votesAbstain,
      participationRate,
      decidedAt: new Date(),
    };
    group.stats.activeProposals = Math.max(0, group.stats.activeProposals - 1);
    await group.save({ session });
    await proposal.save({ session });
    await enqueueEvent(
      `proposal:${proposal.id}:closed`,
      group._id,
      approved ? "proposal_approved" : "proposal_rejected",
      approved ? "Proposition approuvée" : "Proposition rejetée",
      proposal.title,
      { proposalId: proposal._id },
      session,
    );
    return proposal;
  });
}
export async function closeDueProposals() {
  const due = await Proposal.find({
    status: "pending",
    votingDeadline: { $lte: new Date() },
  })
    .select("_id")
    .sort({ votingDeadline: 1, _id: 1 })
    .limit(100);
  for (const proposal of due) {
    try {
      await decideProposal(proposal.id);
    } catch (error) {
      logger.warn("Automatic proposal closure failed", {
        proposalId: proposal.id,
        message: error instanceof Error ? error.message : "failed",
      });
    }
  }
}
