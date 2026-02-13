import { Request, Response } from 'express';
import { Group } from '../models';
import { AuthRequest } from '../middleware/auth';
import { requireAuth } from '../utils/typeGuards';
import mongoose from 'mongoose';

const MEMBER_POPULATE_FIELDS = 'fullName email avatar' as const;

// Create new group
export const createGroup = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    if (!requireAuth(authReq, res)) return;
    
    const {
      name,
      description,
      type,
      avatar,
      settings,
      contributionSettings,
      votingRules,
    } = req.body;

    // Create group with creator as admin
    const group = await Group.create({
      name,
      description,
      type,
      avatar,
      settings: settings || {},
      contributionSettings: contributionSettings || {},
      votingRules: votingRules || {},
      members: [
        {
          userId: authReq.user.id,
          role: 'admin',
          joinedAt: new Date(),
          status: 'active',
          totalContributed: 0,
        },
      ],
      createdBy: authReq.user.id,
      isActive: true,
    });

    await group.populate('members.userId', MEMBER_POPULATE_FIELDS);

    res.status(201).json({
      status: 'success',
      message: 'Group created successfully',
      data: { group },
    });
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create group',
    });
  }
};

// Get all groups for current user
export const getUserGroups = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    if (!requireAuth(authReq, res)) return;

    const groups = await Group.find({
      'members.userId': authReq.user.id,
      'members.status': 'active',
    })
      .populate('members.userId', MEMBER_POPULATE_FIELDS)
      .sort({ updatedAt: -1 });

    res.status(200).json({
      status: 'success',
      data: { groups, count: groups.length },
    });
  } catch (error) {
    console.error('Get user groups error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get groups',
    });
  }
};

// Get group by ID
export const getGroupById = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    if (!requireAuth(authReq, res)) return;
    
    const { id } = req.params;

    const group = await Group.findById(id)
      .populate('members.userId', `${MEMBER_POPULATE_FIELDS} phone`)
      .populate('createdBy', 'fullName email');

    if (!group) {
      res.status(404).json({
        status: 'error',
        message: 'Group not found',
      });
      return;
    }

    // Check if user is a member
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
      data: { group },
    });
  } catch (error) {
    console.error('Get group error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get group',
    });
  }
};

// Update group
export const updateGroup = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    if (!requireAuth(authReq, res)) return;
    const { id } = req.params;
    const {
      name,
      description,
      avatar,
      settings,
      contributionSettings,
      votingRules,
    } = req.body;

    const group = await Group.findById(id);

    if (!group) {
      res.status(404).json({
        status: 'error',
        message: 'Group not found',
      });
      return;
    }

    // Check if user is admin
    const member = group.members.find(
      (m) => m.userId.toString() === authReq.user.id
    );

    if (!member || member.role !== 'admin') {
      res.status(403).json({
        status: 'error',
        message: 'Only group admins can update group settings',
      });
      return;
    }

    // Update fields
    if (name) group.name = name;
    if (description) group.description = description;
    if (avatar) group.avatar = avatar;
    if (settings) group.settings = { ...group.settings, ...settings };
    if (contributionSettings) {
      group.contributionSettings = {
        ...group.contributionSettings,
        ...contributionSettings,
      };
    }
    if (votingRules) {
      group.votingRules = { ...group.votingRules, ...votingRules };
    }

    await group.save();
    await group.populate('members.userId', MEMBER_POPULATE_FIELDS);

    res.status(200).json({
      status: 'success',
      message: 'Group updated successfully',
      data: { group },
    });
  } catch (error) {
    console.error('Update group error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update group',
    });
  }
};

// Archive group (soft delete)
export const archiveGroup = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    if (!requireAuth(authReq, res)) return;
    const { id } = req.params;

    const group = await Group.findById(id);

    if (!group) {
      res.status(404).json({
        status: 'error',
        message: 'Group not found',
      });
      return;
    }

    // Check if user is admin
    const member = group.members.find(
      (m) => m.userId.toString() === authReq.user.id
    );

    if (!member || member.role !== 'admin') {
      res.status(403).json({
        status: 'error',
        message: 'Only group admins can archive the group',
      });
      return;
    }

    group.isActive = false;
    group.archivedAt = new Date();
    await group.save();

    res.status(200).json({
      status: 'success',
      message: 'Group archived successfully',
    });
  } catch (error) {
    console.error('Archive group error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to archive group',
    });
  }
};

// Add member to group
export const addMember = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    if (!requireAuth(authReq, res)) return;
    const { id } = req.params;
    const { userId, role = 'member' } = req.body;

    const group = await Group.findById(id);

    if (!group) {
      res.status(404).json({
        status: 'error',
        message: 'Group not found',
      });
      return;
    }

    // Check if requester is admin or treasurer
    const requesterMember = group.members.find(
      (m) => m.userId.toString() === authReq.user.id
    );

    if (
      !requesterMember ||
      !['admin', 'treasurer'].includes(requesterMember.role)
    ) {
      res.status(403).json({
        status: 'error',
        message: 'Only admins or treasurers can add members',
      });
      return;
    }

    // Validate userId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid userId format',
      });
      return;
    }

    // Check if user is already a member
    const existingMember = group.members.find(
      (m) => m.userId.toString() === userId
    );

    if (existingMember) {
      if (existingMember.status === 'active') {
        res.status(400).json({
          status: 'error',
          message: 'User is already a member',
        });
        return;
      } else {
        // Reactivate member
        existingMember.status = 'active';
        existingMember.joinedAt = new Date();
      }
    } else {
      // Add new member
      group.members.push({
        userId: new mongoose.Types.ObjectId(userId),
        role,
        joinedAt: new Date(),
        status: 'active',
        totalContributed: 0,
      });
    }

    await group.save();
    await group.populate('members.userId', MEMBER_POPULATE_FIELDS);

    res.status(200).json({
      status: 'success',
      message: 'Member added successfully',
      data: { group },
    });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to add member',
    });
  }
};

// Remove member from group
export const removeMember = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    if (!requireAuth(authReq, res)) return;
    const { id, userId } = req.params;

    const group = await Group.findById(id);

    if (!group) {
      res.status(404).json({
        status: 'error',
        message: 'Group not found',
      });
      return;
    }

    // Check if requester is admin
    const requesterMember = group.members.find(
      (m) => m.userId.toString() === authReq.user.id
    );

    if (!requesterMember || requesterMember.role !== 'admin') {
      res.status(403).json({
        status: 'error',
        message: 'Only admins can remove members',
      });
      return;
    }

    // Find and deactivate member
    const member = group.members.find((m) => m.userId.toString() === userId);

    if (!member) {
      res.status(404).json({
        status: 'error',
        message: 'Member not found',
      });
      return;
    }

    // Don't allow removing the last admin
    const activeAdmins = group.members.filter(
      (m) => m.role === 'admin' && m.status === 'active'
    );

    if (member.role === 'admin' && activeAdmins.length === 1) {
      res.status(400).json({
        status: 'error',
        message: 'Cannot remove the last admin',
      });
      return;
    }

    member.status = 'left';
    await group.save();

    res.status(200).json({
      status: 'success',
      message: 'Member removed successfully',
    });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to remove member',
    });
  }
};

// Update member role
export const updateMemberRole = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    if (!requireAuth(authReq, res)) return;
    const { id, userId } = req.params;
    const { role } = req.body;

    const group = await Group.findById(id);

    if (!group) {
      res.status(404).json({
        status: 'error',
        message: 'Group not found',
      });
      return;
    }

    // Check if requester is admin
    const requesterMember = group.members.find(
      (m) => m.userId.toString() === authReq.user.id
    );

    if (!requesterMember || requesterMember.role !== 'admin') {
      res.status(403).json({
        status: 'error',
        message: 'Only admins can change member roles',
      });
      return;
    }

    // Find member
    const member = group.members.find((m) => m.userId.toString() === userId);

    if (!member) {
      res.status(404).json({
        status: 'error',
        message: 'Member not found',
      });
      return;
    }

    // Don't allow changing role of the last admin
    const activeAdmins = group.members.filter(
      (m) => m.role === 'admin' && m.status === 'active'
    );

    if (member.role === 'admin' && activeAdmins.length === 1 && role !== 'admin') {
      res.status(400).json({
        status: 'error',
        message: 'Cannot change role of the last admin',
      });
      return;
    }

    member.role = role;
    await group.save();
    await group.populate('members.userId', MEMBER_POPULATE_FIELDS);

    res.status(200).json({
      status: 'success',
      message: 'Member role updated successfully',
      data: { group },
    });
  } catch (error) {
    console.error('Update member role error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update member role',
    });
  }
};
