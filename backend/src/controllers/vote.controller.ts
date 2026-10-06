import { entityId } from '../utils/membership';
import { Request, Response } from 'express';
import { IVote } from '../models/Vote';
import { Vote, Group } from '../models';
import { AuthRequest } from '../middleware/auth';
import { requireAuth } from '../utils/typeGuards';
import mongoose from 'mongoose';
import logger from '../utils/logger';

const isUserGroupAdmin = async (groupId: mongoose.Types.ObjectId, userId: string): Promise<boolean> => {
  const group = await Group.findById(groupId);
  if (!group || !group.isActive || group.archivedAt) return false;
  const member = group.members.find(
    (m) => entityId(m.userId) === userId && m.status === 'active'
  );
  return member?.role === 'admin';
};

// Anonymous polls disclose only aggregates. Hidden intermediate results disclose no
// ballots (including timestamps/comments) or counts, even to their creator.
export const serializeVote = (vote: IVote, userId: string) => {
  const data = vote.toObject();
  delete data.__v;
  const ownVote = vote.votes.find(ballot => entityId(ballot.userId) === userId);
  const hideResults = !vote.showIntermediateResults && !['closed', 'executed'].includes(vote.status);
  return {
    ...data,
    votes: hideResults || vote.anonymousVoting ? [] : data.votes,
    options: hideResults ? data.options.map((option: { id: string; label: string }) => ({ id: option.id, label: option.label })) : data.options,
    result: hideResults ? undefined : data.result,
    hasVoted: !!ownVote,
    myOptionId: ownVote?.optionId,
  };
};

// Create a new vote in a group
export const createVote = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    if (!requireAuth(authReq, res)) return;
    const { groupId } = req.params;
    const {
      title,
      description,
      type,
      quorumPercentage,
      options,
      endDate,
      allowChangeVote,
      anonymousVoting,
      showIntermediateResults,
    } = req.body;

    // Verify group exists
    const group = await Group.findById(groupId);
    if (!group || !group.isActive || group.archivedAt) {
      res.status(404).json({
        status: 'error',
        message: 'Group not found',
      });
      return;
    }

    // Verify user is a member of the group
    const isMember = group.members.some(
      (member) => entityId(member.userId) === authReq.user.id && member.status === 'active'
    );

    if (!isMember) {
      res.status(403).json({
        status: 'error',
        message: 'You must be a member of this group to create a vote',
      });
      return;
    }

    // Validate endDate is in the future
    if (endDate && new Date(endDate).getTime() <= Date.now()) {
      res.status(400).json({
        status: 'error',
        message: 'End date must be in the future',
      });
      return;
    }

    // Validate quorumPercentage range (defense-in-depth, also validated at route level)
    if (quorumPercentage !== undefined && quorumPercentage !== null) {
      const qp = Number(quorumPercentage);
      if (isNaN(qp) || qp < 0 || qp > 100) {
        res.status(400).json({
          status: 'error',
          message: 'Quorum percentage must be between 0 and 100',
        });
        return;
      }
    }

    // Create options with IDs
    const voteOptions = options.map((opt: { label: unknown }, index: number) => {
      if (typeof opt.label !== 'string' || opt.label.trim() === '') {
        throw new Error('Vote option label must be a non-empty string');
      }
      return {
        id: `option_${index + 1}`,
        label: opt.label,
        votes: 0,
      };
    });

    // Create vote
    const vote = await Vote.create({
      groupId,
      title,
      description,
      createdBy: authReq.user.id,
      type: type || 'simple',
      quorumPercentage,
      options: voteOptions,
      endDate,
      allowChangeVote: allowChangeVote !== undefined ? allowChangeVote : true,
      anonymousVoting: anonymousVoting || false,
      showIntermediateResults:
        showIntermediateResults !== undefined ? showIntermediateResults : true,
      status: 'active',
    });

    await vote.populate('createdBy', 'fullName email avatar');

    res.status(201).json({
      status: 'success',
      message: 'Vote created successfully',
      data: { vote: serializeVote(vote, authReq.user.id) },
    });
  } catch (error) {
    logger.error('Create vote error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create vote',
    });
  }
};

// Get all votes for a group
export const getGroupVotes = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    if (!requireAuth(authReq, res)) return;
    const { groupId } = req.params;
    const { status } = req.query;

    // Verify group exists
    const group = await Group.findById(groupId);
    if (!group || !group.isActive || group.archivedAt) {
      res.status(404).json({
        status: 'error',
        message: 'Group not found',
      });
      return;
    }

    // Verify user is a member of the group
    const isMember = group.members.some(
      (member) => entityId(member.userId) === authReq.user.id && member.status === 'active'
    );

    if (!isMember) {
      res.status(403).json({
        status: 'error',
        message: 'You must be a member of this group to view votes',
      });
      return;
    }

    // Build query
    interface VoteQuery {
      groupId: string;
      status?: string;
    }
    
    const query: VoteQuery = { groupId: groupId as string };
    if (status) {
      query.status = status as string;
    }

    // Get votes
    const votes = await Vote.find(query)
      .populate('createdBy', 'fullName email avatar')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      data: {
        votes: votes.map(vote => serializeVote(vote, authReq.user.id)),
        total: votes.length,
      },
    });
  } catch (error) {
    logger.error('Get group votes error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get votes',
    });
  }
};

// Get vote details
export const getVote = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    if (!requireAuth(authReq, res)) return;
    const { id } = req.params;

    const vote = await Vote.findById(id).populate(
      'createdBy',
      'fullName email avatar'
    );

    if (!vote) {
      res.status(404).json({
        status: 'error',
        message: 'Vote not found',
      });
      return;
    }

    // Verify user is a member of the group
    const group = await Group.findById(vote.groupId);
    if (!group || !group.isActive || group.archivedAt) {
      res.status(404).json({
        status: 'error',
        message: 'Group not found',
      });
      return;
    }

    const isMember = group.members.some(
      (member) => entityId(member.userId) === authReq.user.id && member.status === 'active'
    );

    if (!isMember) {
      res.status(403).json({
        status: 'error',
        message: 'You must be a member of this group to view this vote',
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      data: { vote: serializeVote(vote, authReq.user.id) },
    });
  } catch (error) {
    logger.error('Get vote error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get vote',
    });
  }
};

// Cast a vote
export const castVote = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    if (!requireAuth(authReq, res)) return;
    const { id } = req.params;
    const { optionId, comment } = req.body;

    const vote = await Vote.findById(id);

    if (!vote) {
      res.status(404).json({
        status: 'error',
        message: 'Vote not found',
      });
      return;
    }

    // Verify user is a member of the group
    const group = await Group.findById(vote.groupId);
    if (!group || !group.isActive || group.archivedAt) {
      res.status(404).json({
        status: 'error',
        message: 'Group not found',
      });
      return;
    }

    const isMember = group.members.some(
      (member) => entityId(member.userId) === authReq.user.id && member.status === 'active'
    );

    if (!isMember) {
      res.status(403).json({
        status: 'error',
        message: 'You must be a member of this group to vote',
      });
      return;
    }

    // Check if user can vote
    if (!vote.canUserVote(authReq.user.id)) {
      res.status(400).json({
        status: 'error',
        message: 'You cannot vote at this time',
      });
      return;
    }

    // Verify option exists
    const optionExists = vote.options.some((opt) => opt.id === optionId);
    if (!optionExists) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid option',
      });
      return;
    }

    // Version-checked updates prevent concurrent voters overwriting each other.
    let updatedVote = vote;
    let saved = false;
    for (let attempt = 0; attempt < 8; attempt++) {
      if (!updatedVote.canUserVote(authReq.user.id)) {
        res.status(409).json({ status: 'error', message: 'Voting state changed; reload the poll' });
        return;
      }
      updatedVote.votes = updatedVote.votes.filter(ballot => entityId(ballot.userId) !== authReq.user.id);
      updatedVote.votes.push({ userId: new mongoose.Types.ObjectId(authReq.user.id), optionId, comment, votedAt: new Date() });
      updatedVote.options.forEach(option => {
        option.votes = updatedVote.votes.filter(ballot => ballot.optionId === option.id).length;
      });
      try { await updatedVote.save(); saved = true; break; }
      catch (error) {
        if (!(error instanceof mongoose.Error.VersionError)) throw error;
        const freshVote = await Vote.findById(id);
        if (!freshVote) { res.status(404).json({ status: 'error', message: 'Vote not found' }); return; }
        updatedVote = freshVote;
      }
    }
    if (!saved) { res.status(409).json({ status: 'error', message: 'Concurrent update; retry your vote' }); return; }

    res.status(200).json({
      status: 'success',
      message: 'Vote cast successfully',
      data: { vote: serializeVote(updatedVote, authReq.user.id) },
    });
  } catch (error) {
    logger.error('Cast vote error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to cast vote',
    });
  }
};

// Close a vote
export const closeVote = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    if (!requireAuth(authReq, res)) return;
    const { id } = req.params;

    const vote = await Vote.findById(id);

    if (!vote) {
      res.status(404).json({
        status: 'error',
        message: 'Vote not found',
      });
      return;
    }

    // Verify user is the creator or a group admin
    const group = await Group.findById(vote.groupId);
    const activeMember = group?.isActive && !group.archivedAt && group.members.find(member => entityId(member.userId) === authReq.user.id && member.status === 'active');
    if (!activeMember) { res.status(403).json({ status: 'error', message: 'Active group membership required' }); return; }
    const isCreator = entityId(vote.createdBy) === authReq.user.id;
    const hasAdminAccess = isCreator || await isUserGroupAdmin(vote.groupId, authReq.user.id);

    if (!hasAdminAccess) {
      res.status(403).json({
        status: 'error',
        message: 'Only the vote creator or a group admin can close this vote',
      });
      return;
    }

    // Close vote and calculate results
    let closedVote = vote;
    let closed = false;
    for (let attempt = 0; attempt < 8; attempt++) {
      try { await closedVote.closeVote(group?.members.filter(member => member.status === 'active').length || 0); closed = true; break; }
      catch (error) {
        if (!(error instanceof mongoose.Error.VersionError)) throw error;
        const freshVote = await Vote.findById(id);
        if (!freshVote) { res.status(404).json({ status: 'error', message: 'Vote not found' }); return; }
        closedVote = freshVote;
      }
    }
    if (!closed) { res.status(409).json({ status: 'error', message: 'Concurrent update; retry closing the poll' }); return; }

    res.status(200).json({
      status: 'success',
      message: 'Vote closed successfully',
      data: { vote: serializeVote(closedVote, authReq.user.id) },
    });
  } catch (error) {
    logger.error('Close vote error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to close vote',
    });
  }
};

// Delete a vote (admin only)
export const deleteVote = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    if (!requireAuth(authReq, res)) return;
    const { id } = req.params;

    const vote = await Vote.findById(id);

    if (!vote) {
      res.status(404).json({
        status: 'error',
        message: 'Vote not found',
      });
      return;
    }

    // Verify user is the creator or a group admin
    const group = await Group.findById(vote.groupId);
    const activeMember = group?.isActive && !group.archivedAt && group.members.find(member => entityId(member.userId) === authReq.user.id && member.status === 'active');
    if (!activeMember) { res.status(403).json({ status: 'error', message: 'Active group membership required' }); return; }
    const isCreator = entityId(vote.createdBy) === authReq.user.id;
    const hasAdminAccess = isCreator || await isUserGroupAdmin(vote.groupId, authReq.user.id);

    if (!hasAdminAccess) {
      res.status(403).json({
        status: 'error',
        message: 'Only the vote creator or a group admin can delete this vote',
      });
      return;
    }

    // Only allow deletion if no votes have been cast
    if (vote.votes.length > 0) {
      res.status(400).json({
        status: 'error',
        message: 'Cannot delete a vote that has votes',
      });
      return;
    }

    const deleted = await Vote.findOneAndDelete({ _id: id, 'votes.0': { $exists: false } });
    if (!deleted) { res.status(409).json({ status: 'error', message: 'The poll received a ballot and cannot be deleted' }); return; }

    res.status(200).json({
      status: 'success',
      message: 'Vote deleted successfully',
    });
  } catch (error) {
    logger.error('Delete vote error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete vote',
    });
  }
};
