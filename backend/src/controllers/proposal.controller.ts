import { Request, Response } from 'express';
import { Proposal, Group } from '../models';
import { AuthRequest } from '../middleware/auth';
import { requireAuth } from '../utils/typeGuards';
import mongoose from 'mongoose';

// Create new proposal
export const createProposal = async (
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
      category,
      amount,
      priority,
      attachments,
    } = req.body;

    // Check if group exists and user is a member
    const group = await Group.findById(groupId);

    if (!group) {
      res.status(404).json({
        status: 'error',
        message: 'Group not found',
      });
      return;
    }

    const member = group.members.find(
      (m) => m.userId.toString() === authReq.user.id && m.status === 'active'
    );

    if (!member) {
      res.status(403).json({
        status: 'error',
        message: 'You are not a member of this group',
      });
      return;
    }

    // Check if member can create proposals
    if (
      !group.settings.allowMemberProposals &&
      !['admin', 'treasurer'].includes(member.role)
    ) {
      res.status(403).json({
        status: 'error',
        message: 'Only admins or treasurers can create proposals',
      });
      return;
    }

    // Create proposal
    const votingDuration = group.votingRules.votingDuration || 72; // hours
    const votingDeadline = new Date(
      Date.now() + votingDuration * 60 * 60 * 1000
    );

    const proposal = await Proposal.create({
      groupId,
      proposedBy: authReq.user.id,
      title,
      description,
      category,
      amount: amount || 0,
      priority: priority || 'medium',
      attachments: attachments || [],
      votingDeadline,
      status: 'pending',
      votes: [],
    });

    await proposal.populate('proposedBy', 'fullName email avatar');
    await proposal.populate('groupId', 'name type');

    // Update group stats
    group.stats.totalProposals += 1;
    group.stats.activeProposals += 1;
    await group.save();

    res.status(201).json({
      status: 'success',
      message: 'Proposal created successfully',
      data: { proposal },
    });
  } catch (error) {
    console.error('Create proposal error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create proposal',
    });
  }
};

// Get all proposals for a group
export const getGroupProposals = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    if (!requireAuth(authReq, res)) return;
    const { groupId } = req.params;
    const { status, category } = req.query;

    // Check if group exists and user is a member
    const group = await Group.findById(groupId);

    if (!group) {
      res.status(404).json({
        status: 'error',
        message: 'Group not found',
      });
      return;
    }

    const isMember = group.members.some(
      (m) => m.userId.toString() === authReq.user.id && m.status === 'active'
    );

    if (!isMember) {
      res.status(403).json({
        status: 'error',
        message: 'You are not a member of this group',
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
      .populate('proposedBy', 'fullName email avatar')
      .populate('votes.userId', 'fullName email avatar')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      data: {
        proposals,
        count: proposals.length,
      },
    });
  } catch (error) {
    console.error('Get group proposals error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get proposals',
    });
  }
};

// Get proposal by ID
export const getProposalById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    if (!requireAuth(authReq, res)) return;
    const { id } = req.params;

    const proposal = await Proposal.findById(id)
      .populate('proposedBy', 'fullName email avatar phone')
      .populate('groupId', 'name type')
      .populate('votes.userId', 'fullName email avatar');

    if (!proposal) {
      res.status(404).json({
        status: 'error',
        message: 'Proposal not found',
      });
      return;
    }

    // Check if user is a member of the group
    const group = await Group.findById(proposal.groupId);

    if (!group) {
      res.status(404).json({
        status: 'error',
        message: 'Group not found',
      });
      return;
    }

    const isMember = group.members.some(
      (m) => m.userId.toString() === authReq.user.id && m.status === 'active'
    );

    if (!isMember) {
      res.status(403).json({
        status: 'error',
        message: 'You are not a member of this group',
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      data: { proposal },
    });
  } catch (error) {
    console.error('Get proposal error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get proposal',
    });
  }
};

// Cast vote on proposal
export const castVote = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    if (!requireAuth(authReq, res)) return;
    const { id } = req.params;
    const { vote, comment } = req.body; // vote: 'for' | 'against' | 'abstain'

    const proposal = await Proposal.findById(id);

    if (!proposal) {
      res.status(404).json({
        status: 'error',
        message: 'Proposal not found',
      });
      return;
    }

    // Check if proposal is still open
    if (proposal.status !== 'pending') {
      res.status(400).json({
        status: 'error',
        message: 'Proposal is not open for voting',
      });
      return;
    }

    if (new Date() > new Date(proposal.votingDeadline)) {
      res.status(400).json({
        status: 'error',
        message: 'Voting deadline has passed',
      });
      return;
    }

    // Check if user is a member
    const group = await Group.findById(proposal.groupId);

    if (!group) {
      res.status(404).json({
        status: 'error',
        message: 'Group not found',
      });
      return;
    }

    const isMember = group.members.some(
      (m) => m.userId.toString() === authReq.user.id && m.status === 'active'
    );

    if (!isMember) {
      res.status(403).json({
        status: 'error',
        message: 'You are not a member of this group',
      });
      return;
    }

    // Remove previous vote if exists
    proposal.votes = proposal.votes.filter(
      (v) => v.userId.toString() !== authReq.user.id
    );

    // Add new vote
    const voteData = {
      userId: new mongoose.Types.ObjectId(authReq.user.id),
      decision: vote as 'for' | 'against' | 'abstain',
      comment: comment || '',
      votedAt: new Date(),
    };

    proposal.votes.push(voteData);

    // Calculate results
    const totalMembers = group.members.filter(
      (m) => m.status === 'active'
    ).length;
    const totalVotes = proposal.votes.length;
    const votesFor = proposal.votes.filter((v) => v.decision === 'for').length;
    const votesAgainst = proposal.votes.filter((v) => v.decision === 'against').length;
    const votesAbstain = proposal.votes.filter((v) => v.decision === 'abstain').length;
    const participationRate = (totalVotes / totalMembers) * 100;

    proposal.result = {
      totalVotes,
      votesFor,
      votesAgainst,
      votesAbstain,
      participationRate,
      decidedAt: new Date(),
    };

    await proposal.save();

    await proposal.populate('proposedBy', 'fullName email avatar');
    await proposal.populate('votes.userId', 'fullName email avatar');

    res.status(200).json({
      status: 'success',
      message: 'Vote cast successfully',
      data: { proposal },
    });
  } catch (error) {
    console.error('Cast vote error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to cast vote',
    });
  }
};

// Close proposal (admin/treasurer only)
export const closeProposal = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    if (!requireAuth(authReq, res)) return;
    const { id } = req.params;

    const proposal = await Proposal.findById(id);

    if (!proposal) {
      res.status(404).json({
        status: 'error',
        message: 'Proposal not found',
      });
      return;
    }

    // Check if user is admin or treasurer
    const group = await Group.findById(proposal.groupId);

    if (!group) {
      res.status(404).json({
        status: 'error',
        message: 'Group not found',
      });
      return;
    }

    const member = group.members.find(
      (m) => m.userId.toString() === authReq.user.id
    );

    if (!member || !['admin', 'treasurer'].includes(member.role)) {
      res.status(403).json({
        status: 'error',
        message: 'Only admins or treasurers can close proposals',
      });
      return;
    }

    if (proposal.status !== 'pending') {
      res.status(400).json({
        status: 'error',
        message: 'Proposal is already closed',
      });
      return;
    }

    // Update proposal
    const votesFor = proposal.votes?.filter((v) => v.decision === 'for').length || 0;
    const totalVotes = proposal.votes?.length || 0;
    const approvalThreshold = group.votingRules.approvalThreshold || 50;
    const forPercentage = totalVotes > 0 ? (votesFor / totalVotes) * 100 : 0;
    const quorumMet = totalVotes >= (group.votingRules.quorum / 100) * group.members.filter((m) => m.status === 'active').length;
    
    const approved = quorumMet && forPercentage >= approvalThreshold;
    proposal.status = approved ? 'approved' : 'rejected';

    await proposal.save();

    // Update group stats
    group.stats.activeProposals -= 1;
    await group.save();

    await proposal.populate('proposedBy', 'fullName email avatar');

    res.status(200).json({
      status: 'success',
      message: `Proposal ${proposal.status}`,
      data: { proposal },
    });
  } catch (error) {
    console.error('Close proposal error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to close proposal',
    });
  }
};

// Execute approved proposal (create transaction)
export const executeProposal = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    if (!requireAuth(authReq, res)) return;
    const { id } = req.params;

    const proposal = await Proposal.findById(id);

    if (!proposal) {
      res.status(404).json({
        status: 'error',
        message: 'Proposal not found',
      });
      return;
    }

    // Check if user is admin or treasurer
    const group = await Group.findById(proposal.groupId);

    if (!group) {
      res.status(404).json({
        status: 'error',
        message: 'Group not found',
      });
      return;
    }

    const member = group.members.find(
      (m) => m.userId.toString() === authReq.user.id
    );

    if (!member || !['admin', 'treasurer'].includes(member.role)) {
      res.status(403).json({
        status: 'error',
        message: 'Only admins or treasurers can execute proposals',
      });
      return;
    }

    if (proposal.status !== 'approved') {
      res.status(400).json({
        status: 'error',
        message: 'Proposal must be approved before execution',
      });
      return;
    }

    if (proposal.executedAt) {
      res.status(400).json({
        status: 'error',
        message: 'Proposal has already been executed',
      });
      return;
    }

    // Mark as executed
    proposal.executedAt = new Date();
    proposal.transactionId = undefined; // This would be set when creating a transaction
    await proposal.save();

    res.status(200).json({
      status: 'success',
      message: 'Proposal executed successfully',
      data: { proposal },
    });
  } catch (error) {
    console.error('Execute proposal error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to execute proposal',
    });
  }
};
