import * as notificationService from '../../services/notification.service';
import { Notification, User } from '../../models';
import mongoose from 'mongoose';

// Mock the models
jest.mock('../../models', () => ({
  Notification: {
    create: jest.fn(),
    insertMany: jest.fn(),
  },
  User: {
    findById: jest.fn(),
  },
}));

// Mock mongoose.model for Group lookup
jest.mock('mongoose', () => {
  const actual = jest.requireActual('mongoose');
  return {
    ...actual,
    model: jest.fn(),
  };
});

describe('NotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createNotification', () => {
    it('should create a notification with correct template', async () => {
      const mockUser = {
        _id: new mongoose.Types.ObjectId(),
        fullName: 'Test User',
        email: 'test@example.com',
      };

      const mockNotification = {
        _id: new mongoose.Types.ObjectId(),
        userId: mockUser._id,
        type: 'group_invitation',
        title: 'Invitation à rejoindre un groupe',
        message: 'Vous avez été invité à rejoindre le groupe "Test Group"',
        priority: 'normal',
        isRead: false,
      };

      (Notification.create as jest.Mock).mockResolvedValue(mockNotification);
      (User.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      const result = await notificationService.createNotification(
        mockUser._id.toString(),
        'group_invitation',
        { groupName: 'Test Group' }
      );

      expect(Notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUser._id.toString(),
          type: 'group_invitation',
          title: expect.stringContaining('Invitation'),
          message: expect.stringContaining('Test Group'),
          priority: 'normal',
          isRead: false,
        })
      );

      expect(result).toEqual(mockNotification);
    });

    it('should handle contribution_received notification', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const data = {
        groupName: 'Savings Group',
        amount: 5000,
      };

      const mockNotification = {
        _id: new mongoose.Types.ObjectId(),
        userId,
        type: 'contribution_received',
        title: 'Contribution reçue',
        message: 'Nouvelle contribution de 5000 XOF reçue dans "Savings Group"',
        priority: 'normal',
        isRead: false,
      };

      (Notification.create as jest.Mock).mockResolvedValue(mockNotification);
      (User.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      const result = await notificationService.createNotification(
        userId,
        'contribution_received',
        data
      );

      expect(Notification.create).toHaveBeenCalled();
      expect(result.message).toContain('5000');
      expect(result.message).toContain('Savings Group');
    });

    it('should handle payment_reminder with high priority', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const data = {
        groupName: 'Monthly Tontine',
        amount: 10000,
      };

      const mockNotification = {
        _id: new mongoose.Types.ObjectId(),
        userId,
        type: 'payment_reminder',
        title: 'Rappel de paiement',
        message: 'Votre cotisation de 10000 XOF est attendue pour "Monthly Tontine"',
        priority: 'high',
        isRead: false,
      };

      (Notification.create as jest.Mock).mockResolvedValue(mockNotification);
      (User.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      const result = await notificationService.createNotification(
        userId,
        'payment_reminder',
        data
      );

      expect(result.priority).toBe('high');
    });

    it('should handle member_joined with low priority', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const data = {
        groupName: 'Investment Group',
        memberName: 'John Doe',
      };

      const mockNotification = {
        _id: new mongoose.Types.ObjectId(),
        userId,
        type: 'member_joined',
        title: 'Nouveau membre',
        message: 'John Doe a rejoint le groupe "Investment Group"',
        priority: 'low',
        isRead: false,
      };

      (Notification.create as jest.Mock).mockResolvedValue(mockNotification);
      (User.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      const result = await notificationService.createNotification(
        userId,
        'member_joined',
        data
      );

      expect(result.priority).toBe('low');
      expect(result.message).toContain('John Doe');
    });
  });

  describe('createBatchNotifications', () => {
    it('should create notifications for multiple users', async () => {
      const userIds = [
        new mongoose.Types.ObjectId().toString(),
        new mongoose.Types.ObjectId().toString(),
        new mongoose.Types.ObjectId().toString(),
      ];

      const mockNotifications = userIds.map((userId) => ({
        _id: new mongoose.Types.ObjectId(),
        userId,
        type: 'group_invitation',
        title: 'Invitation à rejoindre un groupe',
        message: 'Vous avez été invité à rejoindre le groupe "Team Group"',
        priority: 'normal',
        isRead: false,
      }));

      (Notification.insertMany as jest.Mock).mockResolvedValue(mockNotifications);
      (User.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      const result = await notificationService.createBatchNotifications(
        userIds,
        'group_invitation',
        { groupName: 'Team Group' }
      );

      expect(Notification.insertMany).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'group_invitation',
            title: expect.stringContaining('Invitation'),
            message: expect.stringContaining('Team Group'),
          }),
        ])
      );

      expect(result).toHaveLength(3);
    });

    it('should handle vote_reminder with high priority', async () => {
      const userIds = [
        new mongoose.Types.ObjectId().toString(),
        new mongoose.Types.ObjectId().toString(),
      ];

      const data = {
        voteTitle: 'Budget Proposal',
        timeRemaining: '2 jours',
      };

      const mockNotifications = userIds.map((userId) => ({
        _id: new mongoose.Types.ObjectId(),
        userId,
        type: 'vote_reminder',
        priority: 'high',
      }));

      (Notification.insertMany as jest.Mock).mockResolvedValue(mockNotifications);
      (User.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      const result = await notificationService.createBatchNotifications(
        userIds,
        'vote_reminder',
        data
      );

      expect(Notification.insertMany).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            priority: 'high',
          }),
        ])
      );

      expect(result).toHaveLength(2);
    });
  });

  describe('notifyGroupMembers', () => {
    it('should notify all active group members', async () => {
      const groupId = new mongoose.Types.ObjectId();
      const memberIds = [
        new mongoose.Types.ObjectId(),
        new mongoose.Types.ObjectId(),
        new mongoose.Types.ObjectId(),
      ];

      const mockGroup = {
        _id: groupId,
        members: memberIds.map((userId) => ({
          userId,
          status: 'active',
        })),
      };

      const mockGroupModel = {
        findById: jest.fn().mockResolvedValue(mockGroup),
      };

      (mongoose.model as jest.Mock).mockReturnValue(mockGroupModel);
      (Notification.insertMany as jest.Mock).mockResolvedValue([]);
      (User.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      await notificationService.notifyGroupMembers(
        groupId.toString(),
        'proposal_created',
        {
          groupName: 'Test Group',
          proposalTitle: 'New Budget',
        }
      );

      expect(mockGroupModel.findById).toHaveBeenCalledWith(groupId.toString());
      expect(Notification.insertMany).toHaveBeenCalled();
    });

    it('should exclude specified users from notification', async () => {
      const groupId = new mongoose.Types.ObjectId();
      const member1 = new mongoose.Types.ObjectId();
      const member2 = new mongoose.Types.ObjectId();
      const member3 = new mongoose.Types.ObjectId();

      const mockGroup = {
        _id: groupId,
        members: [
          { userId: member1, status: 'active' },
          { userId: member2, status: 'active' },
          { userId: member3, status: 'active' },
        ],
      };

      const mockGroupModel = {
        findById: jest.fn().mockResolvedValue(mockGroup),
      };

      (mongoose.model as jest.Mock).mockReturnValue(mockGroupModel);
      (Notification.insertMany as jest.Mock).mockResolvedValue([]);
      (User.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      await notificationService.notifyGroupMembers(
        groupId.toString(),
        'proposal_created',
        {
          groupName: 'Test Group',
          proposalTitle: 'New Budget',
        },
        [member1] // Exclude member1 (the one who created the proposal)
      );

      expect(Notification.insertMany).toHaveBeenCalled();
      const insertedNotifications = (Notification.insertMany as jest.Mock).mock.calls[0][0];
      
      // Should only have 2 notifications (excluding member1)
      expect(insertedNotifications).toHaveLength(2);
    });

    it('should not notify inactive members', async () => {
      const groupId = new mongoose.Types.ObjectId();
      const activeMembers = [
        new mongoose.Types.ObjectId(),
        new mongoose.Types.ObjectId(),
      ];
      const inactiveMember = new mongoose.Types.ObjectId();

      const mockGroup = {
        _id: groupId,
        members: [
          { userId: activeMembers[0], status: 'active' },
          { userId: activeMembers[1], status: 'active' },
          { userId: inactiveMember, status: 'inactive' },
        ],
      };

      const mockGroupModel = {
        findById: jest.fn().mockResolvedValue(mockGroup),
      };

      (mongoose.model as jest.Mock).mockReturnValue(mockGroupModel);
      (Notification.insertMany as jest.Mock).mockResolvedValue([]);
      (User.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      await notificationService.notifyGroupMembers(
        groupId.toString(),
        'proposal_created',
        {
          groupName: 'Test Group',
          proposalTitle: 'New Budget',
        }
      );

      const insertedNotifications = (Notification.insertMany as jest.Mock).mock.calls[0][0];
      
      // Should only have 2 notifications (only active members)
      expect(insertedNotifications).toHaveLength(2);
    });
  });
});

