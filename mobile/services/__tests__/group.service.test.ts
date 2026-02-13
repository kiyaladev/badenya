import groupService, { Group, CreateGroupData, UpdateGroupData } from '../group.service';
import api from '../api';

// Mock the API module
jest.mock('../api', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

describe('GroupService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getMyGroups', () => {
    it('should fetch all groups successfully', async () => {
      const mockGroups: Group[] = [
        {
          _id: '1',
          name: 'Group 1',
          type: 'tontine',
          contributionAmount: 1000,
          frequency: 'monthly',
          members: [],
          balance: 5000,
          currency: 'XOF',
          createdAt: new Date().toISOString(),
        },
        {
          _id: '2',
          name: 'Group 2',
          type: 'saving',
          contributionAmount: 2000,
          frequency: 'weekly',
          members: [],
          balance: 10000,
          currency: 'XOF',
          createdAt: new Date().toISOString(),
        },
      ];

      (api.get as jest.Mock).mockResolvedValue({ data: mockGroups });

      const result = await groupService.getMyGroups();

      expect(api.get).toHaveBeenCalledWith('/groups');
      expect(result).toEqual(mockGroups);
      expect(result).toHaveLength(2);
    });

    it('should handle API errors', async () => {
      const errorMessage = 'Network error';
      (api.get as jest.Mock).mockRejectedValue(new Error(errorMessage));

      await expect(groupService.getMyGroups()).rejects.toThrow(errorMessage);
      expect(api.get).toHaveBeenCalledWith('/groups');
    });
  });

  describe('getGroupById', () => {
    it('should fetch group by ID successfully', async () => {
      const mockGroup: Group = {
        _id: '1',
        name: 'Test Group',
        type: 'tontine',
        contributionAmount: 1000,
        frequency: 'monthly',
        members: [],
        balance: 5000,
        currency: 'XOF',
        createdAt: new Date().toISOString(),
      };

      (api.get as jest.Mock).mockResolvedValue({ data: mockGroup });

      const result = await groupService.getGroupById('1');

      expect(api.get).toHaveBeenCalledWith('/groups/1');
      expect(result).toEqual(mockGroup);
    });

    it('should handle not found error', async () => {
      (api.get as jest.Mock).mockRejectedValue(new Error('Group not found'));

      await expect(groupService.getGroupById('999')).rejects.toThrow('Group not found');
    });
  });

  describe('createGroup', () => {
    it('should create a new group successfully', async () => {
      const newGroupData: CreateGroupData = {
        name: 'New Group',
        description: 'Test Description',
        type: 'tontine',
        contributionAmount: 1000,
        frequency: 'monthly',
      };

      const createdGroup: Group = {
        _id: '3',
        ...newGroupData,
        members: [],
        balance: 0,
        currency: 'XOF',
        createdAt: new Date().toISOString(),
      };

      (api.post as jest.Mock).mockResolvedValue({ data: createdGroup });

      const result = await groupService.createGroup(newGroupData);

      expect(api.post).toHaveBeenCalledWith('/groups', newGroupData);
      expect(result).toEqual(createdGroup);
      expect(result.name).toBe('New Group');
    });

    it('should handle validation errors', async () => {
      const invalidData: CreateGroupData = {
        name: '',
        type: 'tontine',
        contributionAmount: 1000,
        frequency: 'monthly',
      };

      (api.post as jest.Mock).mockRejectedValue(new Error('Validation failed'));

      await expect(groupService.createGroup(invalidData)).rejects.toThrow('Validation failed');
    });
  });

  describe('updateGroup', () => {
    it('should update group successfully', async () => {
      const updateData: UpdateGroupData = {
        name: 'Updated Name',
        contributionAmount: 2000,
      };

      const updatedGroup: Group = {
        _id: '1',
        name: 'Updated Name',
        type: 'tontine',
        contributionAmount: 2000,
        frequency: 'monthly',
        members: [],
        balance: 5000,
        currency: 'XOF',
        createdAt: new Date().toISOString(),
      };

      (api.put as jest.Mock).mockResolvedValue({ data: updatedGroup });

      const result = await groupService.updateGroup('1', updateData);

      expect(api.put).toHaveBeenCalledWith('/groups/1', updateData);
      expect(result).toEqual(updatedGroup);
      expect(result.name).toBe('Updated Name');
    });

    it('should handle unauthorized update', async () => {
      (api.put as jest.Mock).mockRejectedValue(new Error('Unauthorized'));

      await expect(groupService.updateGroup('1', { name: 'New Name' })).rejects.toThrow(
        'Unauthorized'
      );
    });
  });

  describe('deleteGroup', () => {
    it('should delete group successfully', async () => {
      (api.delete as jest.Mock).mockResolvedValue({ data: {} });

      await groupService.deleteGroup('1');

      expect(api.delete).toHaveBeenCalledWith('/groups/1');
    });

    it('should handle delete error', async () => {
      (api.delete as jest.Mock).mockRejectedValue(new Error('Failed to delete'));

      await expect(groupService.deleteGroup('1')).rejects.toThrow('Failed to delete');
    });
  });

  describe('addMember', () => {
    it('should add member to group successfully', async () => {
      (api.post as jest.Mock).mockResolvedValue({ data: {} });

      await groupService.addMember('1', 'user123');

      expect(api.post).toHaveBeenCalledWith('/groups/1/members', { userId: 'user123' });
    });
  });

  describe('removeMember', () => {
    it('should remove member from group successfully', async () => {
      (api.delete as jest.Mock).mockResolvedValue({ data: {} });

      await groupService.removeMember('1', 'user123');

      expect(api.delete).toHaveBeenCalledWith('/groups/1/members/user123');
    });
  });

  describe('updateMemberRole', () => {
    it('should update member role successfully', async () => {
      (api.put as jest.Mock).mockResolvedValue({ data: {} });

      await groupService.updateMemberRole('1', 'user123', 'treasurer');

      expect(api.put).toHaveBeenCalledWith('/groups/1/members/user123/role', { role: 'treasurer' });
    });

    it('should handle different roles', async () => {
      (api.put as jest.Mock).mockResolvedValue({ data: {} });

      const roles = ['admin', 'treasurer', 'member'] as const;

      for (const role of roles) {
        await groupService.updateMemberRole('1', 'user123', role);
        expect(api.put).toHaveBeenCalledWith('/groups/1/members/user123/role', { role });
      }
    });
  });
});
