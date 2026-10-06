import { decideProposal } from "../services/proposal-lifecycle.service";
import { enqueueEvent } from "../services/events.service";
import { activeMember } from "../utils/membership";
import {
  atomic,
  executeFinancialProposal,
  BusinessError,
} from "../services/financial.service";
import { entityId } from "../utils/membership";
import { Request, Response } from "express";
import { Proposal, Group } from "../models";
import { AuthRequest } from "../middleware/auth";
import { requireAuth } from "../utils/typeGuards";
import mongoose from "mongoose";
import logger from "../utils/logger";

// Create new proposal
export const createProposal = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const authReq = req as AuthRequest;
  if (!requireAuth(authReq, res)) return;
  try {
    const proposal = await atomic(async (session) => {
      const group = await Group.findById(req.params.groupId).session(session);
      const member = activeMember(group, authReq.user.id);
      if (!group || !member)
        throw new BusinessError(403, "Membre actif requis");
      if (
        !group.settings.allowMemberProposals &&
        !["admin", "treasurer"].includes(member.role)
      )
        throw new BusinessError(403, "Responsable actif requis");
      const amount = Number(req.body.amount);
      if (!Number.isFinite(amount) || amount <= 0)
        throw new BusinessError(400, "Montant positif requis");
      const month = new Date();
      month.setUTCDate(1);
      month.setUTCHours(0, 0, 0, 0);
      const count = await Proposal.countDocuments({
        groupId: group._id,
        proposedBy: authReq.user.id,
        createdAt: { $gte: month },
      }).session(session);
      if (count >= group.settings.maxProposalsPerMonth)
        throw new BusinessError(
          409,
          "Limite mensuelle de propositions atteinte",
        );
      const saved = new Proposal({
        groupId: group._id,
        proposedBy: authReq.user.id,
        title: req.body.title,
        description: req.body.description,
        category: req.body.category,
        amount,
        currency: group.currency,
        recipient: req.body.recipient,
        priority: req.body.priority || "medium",
        attachments: req.body.attachments || [],
        votingDeadline: new Date(
          Date.now() + group.votingRules.votingDuration * 3600000,
        ),
        status: "pending",
        votes: [],
      });
      await saved.save({ session });
      group.stats.totalProposals += 1;
      group.stats.activeProposals += 1;
      await group.save({ session });
      await enqueueEvent(
        `proposal:${saved.id}:created`,
        group._id,
        "proposal_created",
        "Nouvelle proposition",
        saved.title,
        { proposalId: saved._id },
        session,
      );
      return saved;
    });
    await proposal.populate("proposedBy", "fullName email avatar");
    await proposal.populate("groupId", "name type currency");
    res.status(201).json({ status: "success", data: { proposal } });
  } catch (error) {
    if (error instanceof BusinessError) {
      res
        .status(error.status)
        .json({ status: "error", code: error.code, message: error.message });
      return;
    }
    logger.error("Create proposal", error);
    res.status(500).json({ status: "error", message: "Échec de la création" });
  }
};

// Get all proposals for a group
export const getGroupProposals = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    if (!requireAuth(authReq, res)) return;
    const { groupId } = req.params;
    const { status, category } = req.query;

    // Check if group exists and user is a member
    const group = await Group.findById(groupId);

    if (!group || !group.isActive || group.archivedAt) {
      res.status(404).json({
        status: "error",
        message: "Group not found",
      });
      return;
    }

    const isMember = group.members.some(
      (m) => entityId(m.userId) === authReq.user.id && m.status === "active",
    );

    if (!isMember) {
      res.status(403).json({
        status: "error",
        message: "You are not a member of this group",
      });
      return;
    }

    // Build query
    interface ProposalQuery {
      groupId: string;
      status?: string;
      category?: string;
    }

    const query: ProposalQuery = { groupId: groupId as string };
    if (status) query.status = status as string;
    if (category) query.category = category as string;

    const proposals = await Proposal.find(query)
      .populate("proposedBy", "fullName email avatar")
      .populate("votes.userId", "fullName email avatar")
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: "success",
      data: {
        proposals,
        count: proposals.length,
      },
    });
  } catch (error) {
    logger.error("Get group proposals error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to get proposals",
    });
  }
};

// Get proposal by ID
export const getProposalById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    if (!requireAuth(authReq, res)) return;
    const { id } = req.params;

    const proposal = await Proposal.findById(id)
      .populate("proposedBy", "fullName email avatar phone")
      .populate("groupId", "name type")
      .populate("votes.userId", "fullName email avatar");

    if (!proposal) {
      res.status(404).json({
        status: "error",
        message: "Proposal not found",
      });
      return;
    }

    // Check if user is a member of the group
    const group = await Group.findById(proposal.groupId);

    if (!group || !group.isActive || group.archivedAt) {
      res.status(404).json({
        status: "error",
        message: "Group not found",
      });
      return;
    }

    const isMember = group.members.some(
      (m) => entityId(m.userId) === authReq.user.id && m.status === "active",
    );

    if (!isMember) {
      res.status(403).json({
        status: "error",
        message: "You are not a member of this group",
      });
      return;
    }

    res.status(200).json({
      status: "success",
      data: { proposal },
    });
  } catch (error) {
    logger.error("Get proposal error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to get proposal",
    });
  }
};

// Cast vote on proposal
export const castVote = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  if (!requireAuth(authReq, res)) return;
  try {
    const proposal = await atomic(async (session) => {
      const saved = await Proposal.findById(req.params.id).session(session);
      if (!saved) throw new BusinessError(404, "Proposition introuvable");
      if (saved.status !== "pending" || saved.votingDeadline <= new Date())
        throw new BusinessError(409, "Vote clôturé");
      const group = await Group.findById(saved.groupId).session(session);
      if (!group) throw new BusinessError(404, "Groupe introuvable");
      if (!activeMember(group, authReq.user.id))
        throw new BusinessError(403, "Membre actif requis");
      const decision = req.body.vote;
      if (
        !["for", "against", "abstain"].includes(decision) ||
        (decision === "abstain" && !group.votingRules.allowAbstention)
      )
        throw new BusinessError(400, "Choix de vote invalide");
      saved.votes = saved.votes.filter(
        (v) => entityId(v.userId) !== authReq.user.id,
      );
      saved.votes.push({
        userId: new mongoose.Types.ObjectId(authReq.user.id),
        decision,
        comment: String(req.body.comment || "").slice(0, 1000),
        votedAt: new Date(),
      });
      const activeIds = new Set(
        group.members
          .filter((m) => m.status === "active")
          .map((m) => entityId(m.userId)),
      );
      const votes = saved.votes.filter((v) =>
        activeIds.has(entityId(v.userId)),
      );
      saved.result = {
        totalVotes: votes.length,
        votesFor: votes.filter((v) => v.decision === "for").length,
        votesAgainst: votes.filter((v) => v.decision === "against").length,
        votesAbstain: votes.filter((v) => v.decision === "abstain").length,
        participationRate: activeIds.size
          ? (votes.length / activeIds.size) * 100
          : 0,
        decidedAt: new Date(),
      };
      await saved.save({ session });
      return saved;
    });
    await proposal.populate("proposedBy", "fullName email avatar");
    res.json({ status: "success", data: { proposal } });
  } catch (error) {
    if (error instanceof BusinessError) {
      res
        .status(error.status)
        .json({ status: "error", code: error.code, message: error.message });
      return;
    }
    logger.error("Cast proposal vote:", error);
    res.status(500).json({ status: "error", message: "Échec du vote" });
  }
};

// Close proposal (admin/treasurer only)
export const closeProposal = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const authReq = req as AuthRequest;
  if (!requireAuth(authReq, res)) return;
  try {
    const proposal = await decideProposal(
      String(req.params.id),
      authReq.user.id,
    );
    res.json({ status: "success", data: { proposal } });
  } catch (error) {
    if (error instanceof BusinessError) {
      res
        .status(error.status)
        .json({ status: "error", code: error.code, message: error.message });
      return;
    }
    logger.error("Close proposal", error);
    res.status(500).json({ status: "error", message: "Échec de clôture" });
  }
};

// Execute approved proposal (create transaction)
export const executeProposal = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const authReq = req as AuthRequest;
  if (!requireAuth(authReq, res)) return;
  try {
    const proposal = await executeFinancialProposal(
      String(req.params.id),
      authReq.user.id,
    );
    res.json({ status: "success", data: { proposal } });
  } catch (error) {
    if (error instanceof BusinessError) {
      res
        .status(error.status)
        .json({ status: "error", code: error.code, message: error.message });
      return;
    }
    logger.error("Execute proposal:", error);
    res.status(500).json({ status: "error", message: "Échec de l’exécution" });
  }
};

/**
 * Delete/cancel a proposal (only creator or group admin)
 */
export const deleteProposal = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const authReq = req as AuthRequest;
  if (!requireAuth(authReq, res)) return;
  try {
    await atomic(async (session) => {
      const proposal = await Proposal.findById(req.params.id).session(session);
      if (!proposal) throw new BusinessError(404, "Proposition introuvable");
      const group = await Group.findById(proposal.groupId).session(session);
      const member = activeMember(group, authReq.user.id);
      if (
        !group ||
        !member ||
        (entityId(proposal.proposedBy) !== authReq.user.id &&
          member.role !== "admin")
      )
        throw new BusinessError(403, "Membre autorisé actif requis");
      if (proposal.status === "executed")
        throw new BusinessError(409, "Proposition déjà exécutée");
      await Proposal.deleteOne(
        { _id: proposal._id, status: { $ne: "executed" } },
        { session },
      );
      group.stats.totalProposals = Math.max(0, group.stats.totalProposals - 1);
      if (proposal.status === "pending")
        group.stats.activeProposals = Math.max(
          0,
          group.stats.activeProposals - 1,
        );
      await group.save({ session });
    });
    res.json({ status: "success", message: "Proposition supprimée" });
  } catch (error) {
    if (error instanceof BusinessError) {
      res
        .status(error.status)
        .json({ status: "error", code: error.code, message: error.message });
      return;
    }
    logger.error("Delete proposal", error);
    res.status(500).json({ status: "error", message: "Échec de suppression" });
  }
};
