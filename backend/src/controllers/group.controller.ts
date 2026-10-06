import { groupEvent } from '../utils/groupEvents';
import { entityId } from '../utils/membership';
import { Request, Response } from 'express';
import { Group, User } from '../models';
import { AuthRequest } from '../middleware/auth';
import { requireAuth } from '../utils/typeGuards';
import mongoose from 'mongoose';
import logger from '../utils/logger';

function safeGroup(group: import('../models/Group').IGroup, actor: string) {
  const data = group.toObject();
  const member = group.members.find(m => entityId(m.userId) === actor && m.status === 'active');
  if (member?.role !== 'admin') { delete data.invitationCode; delete data.joinRequests; }
  return data;
}
function mutationError(error: unknown, res: Response): boolean {
  if (error instanceof mongoose.Error.VersionError) { res.status(409).json({status:'error',message:'Le groupe a été modifié : rechargez puis réessayez'}); return true; }
  if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) { res.status(400).json({status:'error',message:'Données de groupe invalides'}); return true; }
  return false;
}

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
      currency: req.body.currency || "XOF",
      avatar: typeof avatar === 'string' ? {url:avatar} : avatar,
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

    await groupEvent(group, 'created', 'member_joined', 'Groupe créé', `Le groupe ${group.name} est créé`);
    await group.populate('members.userId', MEMBER_POPULATE_FIELDS);

    res.status(201).json({
      status: 'success',
      message: 'Group created successfully',
      data: { group: safeGroup(group, authReq.user.id) },
    });
  } catch (error) {
    if (mutationError(error, res)) return;
    logger.error('Create group error:', error);
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
      members: { $elemMatch: { userId: authReq.user.id, status: 'active' } },
      isActive: true, archivedAt: { $exists: false },
    })
      .populate('members.userId', MEMBER_POPULATE_FIELDS)
      .sort({ updatedAt: -1 });

    res.status(200).json({
      status: 'success',
      data: { groups: groups.map(group => safeGroup(group, authReq.user.id)), count: groups.length },
    });
  } catch (error) {
    if (mutationError(error, res)) return;
    logger.error('Get user groups error:', error);
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

    if (!group || !group.isActive || group.archivedAt) {
      res.status(404).json({
        status: 'error',
        message: 'Group not found',
      });
      return;
    }

    // Check if user is a member
    const isMember = group.members.some(
      (m) => entityId(m.userId) === authReq.user.id && m.status === 'active'
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
      data: { group: safeGroup(group, authReq.user.id) },
    });
  } catch (error) {
    if (mutationError(error, res)) return;
    logger.error('Get group error:', error);
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
      type,
      avatar,
      settings,
      contributionSettings,
      votingRules,
    } = req.body;

    const group = await Group.findById(id);

    if (!group || !group.isActive || group.archivedAt) {
      res.status(404).json({
        status: 'error',
        message: 'Group not found',
      });
      return;
    }

    // Check if user is admin
    const member = group.members.find(
      (m) => entityId(m.userId) === authReq.user.id && m.status === "active"
    );

    if (!member || member.role !== 'admin') {
      res.status(403).json({
        status: 'error',
        message: 'Only group admins can update group settings',
      });
      return;
    }

    if (req.body.currency !== undefined && req.body.currency !== group.currency) { res.status(400).json({status:'error',message:'La devise du groupe est immuable'}); return; }
    // Update fields
    if (name) group.name = name;
    if (description) group.description = description;
    if (type) group.type = type;
    if (avatar) group.avatar = avatar;
    if (settings) {
      if (settings.maxMembers !== undefined && settings.maxMembers < group.members.filter(member => member.status === 'active').length) { res.status(409).json({status:'error',message:'La capacité ne peut exclure des membres actifs'}); return; }
      group.settings = { ...group.settings, ...settings };
    }
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
      data: { group: safeGroup(group, authReq.user.id) },
    });
  } catch (error) {
    if (mutationError(error, res)) return;
    logger.error('Update group error:', error);
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

    if (!group || !group.isActive || group.archivedAt) {
      res.status(404).json({
        status: 'error',
        message: 'Group not found',
      });
      return;
    }

    // Check if user is admin
    const member = group.members.find(
      (m) => entityId(m.userId) === authReq.user.id && m.status === "active"
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
    await groupEvent(group, 'archived', 'group_archived', 'Groupe archivé', `${group.name} est archivé`);

    res.status(200).json({
      status: 'success',
      message: 'Group archived successfully',
    });
  } catch (error) {
    if (mutationError(error, res)) return;
    logger.error('Archive group error:', error);
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

    if (!group || !group.isActive || group.archivedAt) {
      res.status(404).json({
        status: 'error',
        message: 'Group not found',
      });
      return;
    }

    // Check if requester is admin or treasurer
    const requesterMember = group.members.find(
      (m) => entityId(m.userId) === authReq.user.id && m.status === "active"
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

    if (requesterMember.role === 'treasurer' && role !== 'member') { res.status(403).json({status:'error',message:'Seul un administrateur attribue des responsabilités'}); return; }
    const target = await User.findOne({_id:userId,isActive:true}).select('_id fullName');
    if (!target) { res.status(404).json({status:'error',message:'Compte actif introuvable'}); return; }
    if (group.members.filter(member => member.status === 'active').length >= (group.settings.maxMembers || 100)) { res.status(409).json({status:'error',message:'Capacité du groupe atteinte'}); return; }
    // Check if user is already a member
    const existingMember = group.members.find(
      (m) => entityId(m.userId) === userId
    );

    if (existingMember) {
      if (existingMember.status === 'active') {
        res.status(400).json({
          status: 'error',
          message: 'User is already a member',
        });
        return;
      } else {
        if (existingMember.status === 'suspended' && requesterMember.role !== 'admin') { res.status(403).json({status:'error',message:'Seul un administrateur réactive un membre suspendu'}); return; }
        // Reactivate member
        existingMember.status = 'active';
        existingMember.joinedAt = new Date();
        existingMember.role = role;
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
    await groupEvent(group, `member:${userId}`, 'member_joined', 'Membre ajouté', `${target.fullName} a rejoint ${group.name}`);
    await group.populate('members.userId', MEMBER_POPULATE_FIELDS);

    res.status(200).json({
      status: 'success',
      message: 'Member added successfully',
      data: { group: safeGroup(group, authReq.user.id) },
    });
  } catch (error) {
    if (mutationError(error, res)) return;
    logger.error('Add member error:', error);
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

    if (!group || !group.isActive || group.archivedAt) {
      res.status(404).json({
        status: 'error',
        message: 'Group not found',
      });
      return;
    }

    // Check if requester is admin
    const requesterMember = group.members.find(
      (m) => entityId(m.userId) === authReq.user.id && m.status === "active"
    );

    if (!requesterMember || requesterMember.role !== 'admin') {
      res.status(403).json({
        status: 'error',
        message: 'Only admins can remove members',
      });
      return;
    }

    // Find and deactivate member
    const member = group.members.find((m) => entityId(m.userId) === userId);

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

    if (member.status === 'active' && member.role === 'admin' && activeAdmins.length === 1) {
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
    if (mutationError(error, res)) return;
    logger.error('Remove member error:', error);
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

    if (!group || !group.isActive || group.archivedAt) {
      res.status(404).json({
        status: 'error',
        message: 'Group not found',
      });
      return;
    }

    // Check if requester is admin
    const requesterMember = group.members.find(
      (m) => entityId(m.userId) === authReq.user.id && m.status === "active"
    );

    if (!requesterMember || requesterMember.role !== 'admin') {
      res.status(403).json({
        status: 'error',
        message: 'Only admins can change member roles',
      });
      return;
    }

    // Find member
    const member = group.members.find((m) => entityId(m.userId) === userId);

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

    if (member.status === 'active' && member.role === 'admin' && activeAdmins.length === 1 && role !== 'admin') {
      res.status(400).json({
        status: 'error',
        message: 'Cannot change role of the last admin',
      });
      return;
    }

    member.role = role;
    await group.save();
    const roleLabels = {admin:'administrateur',treasurer:'trésorier',member:'membre'};
    await groupEvent(group, `role:${userId}:${role}`, 'role_changed', 'Rôle modifié', `Un membre de ${group.name} est désormais ${roleLabels[role as keyof typeof roleLabels] || role}`);
    await group.populate('members.userId', MEMBER_POPULATE_FIELDS);

    res.status(200).json({
      status: 'success',
      message: 'Member role updated successfully',
      data: { group: safeGroup(group, authReq.user.id) },
    });
  } catch (error) {
    if (mutationError(error, res)) return;
    logger.error('Update member role error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update member role',
    });
  }
};
