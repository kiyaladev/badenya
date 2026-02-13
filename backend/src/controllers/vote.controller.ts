import { Request, Response } from 'express';
import { Vote, Group } from '../models';
import { AuthRequest } from '../middleware/auth';
import { requireAuth } from '../utils/typeGuards';
import mongoose from 'mongoose';

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
    if (!group) {
      res.status(404).json({
        status: 'error',
        message: 'Group not found',
      });
      return;
    }

    // Verify user is a member of the group
    const isMember = group.members.some(
      (member) => member.userId.toString() === authReq.user.id
    );

    if (!isMember) {
      res.status(403).json({
        status: 'error',
        message: 'You must be a member of this group to create a vote',
      });
      return;
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
      data: { vote },
    });
  } catch (error) {
    console.error('Create vote error:', error);
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
    if (!group) {
      res.status(404).json({
        status: 'error',
        message: 'Group not found',
      });
      return;
    }

    // Verify user is a member of the group
    const isMember = group.members.some(
      (member) => member.userId.toString() === authReq.user.id
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
        votes,
        total: votes.length,
      },
    });
  } catch (error) {
    console.error('Get group votes error:', error);
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
    if (!group) {
      res.status(404).json({
        status: 'error',
        message: 'Group not found',
      });
      return;
    }

    const isMember = group.members.some(
      (member) => member.userId.toString() === authReq.user.id
    );

    if (!isMember) {
      res.status(403).json({
        status: 'error',
        message: 'You must be a member of this group to view this vote',
      });
      return;
    }

    // If voting is anonymous, hide voter identities
    const voteData = vote.toObject();
    if (vote.anonymousVoting) {
      voteData.votes = voteData.votes.map((v) => ({
        userId: v.userId, // Keep userId but don't populate
        optionId: v.optionId,
        comment: v.comment,
        votedAt: v.votedAt,
      }));
    }

    res.status(200).json({
      status: 'success',
      data: { vote: voteData },
    });
  } catch (error) {
    console.error('Get vote error:', error);
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
    if (!group) {
      res.status(404).json({
        status: 'error',
        message: 'Group not found',
      });
      return;
    }

    const isMember = group.members.some(
      (member) => member.userId.toString() === authReq.user.id
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

    // Remove previous vote if exists and changing is allowed
    if (vote.allowChangeVote) {
      vote.votes = vote.votes.filter(
        (v) => v.userId.toString() !== authReq.user.id
      );
    }

    // Add new vote
    vote.votes.push({
      userId: new mongoose.Types.ObjectId(authReq.user.id),
      optionId,
      comment,
      votedAt: new Date(),
    });

    // Update option vote count
    const option = vote.options.find((opt) => opt.id === optionId);
    if (option) {
      option.votes = vote.votes.filter((v) => v.optionId === optionId).length;
    }

    await vote.save();

    res.status(200).json({
      status: 'success',
      message: 'Vote cast successfully',
      data: { vote },
    });
  } catch (error) {
    console.error('Cast vote error:', error);
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

    // Verify user is the creator or an admin
    if (vote.createdBy.toString() !== authReq.user.id) {
      // TODO: Also check if user is group admin
      res.status(403).json({
        status: 'error',
        message: 'Only the vote creator can close this vote',
      });
      return;
    }

    // Close vote and calculate results
    await vote.closeVote();

    res.status(200).json({
      status: 'success',
      message: 'Vote closed successfully',
      data: { vote },
    });
  } catch (error) {
    console.error('Close vote error:', error);
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

    // Verify user is the creator or an admin
    if (vote.createdBy.toString() !== authReq.user.id) {
      // TODO: Also check if user is group admin
      res.status(403).json({
        status: 'error',
        message: 'Only the vote creator can delete this vote',
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

    await Vote.findByIdAndDelete(id);

    res.status(200).json({
      status: 'success',
      message: 'Vote deleted successfully',
    });
  } catch (error) {
    console.error('Delete vote error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete vote',
    });
  }
};
