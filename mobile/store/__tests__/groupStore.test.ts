import { renderHook, act } from '@testing-library/react-native';
import { useGroupStore } from '../groupStore';
import groupService from '../../services/group.service';

// Mock the group service
jest.mock('../../services/group.service', () => ({
  __esModule: true,
  default: {
    getMyGroups: jest.fn(),
    getGroupById: jest.fn(),
    createGroup: jest.fn(),
    updateGroup: jest.fn(),
    deleteGroup: jest.fn(),
  },
}));

describe('GroupStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    const { result } = renderHook(() => useGroupStore());
    act(() => {
      result.current.clearError();
      useGroupStore.setState({
        groups: [],
        currentGroup: null,
        isLoading: false,
        error: null,
      });
    });
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useGroupStore());

      expect(result.current.groups).toEqual([]);
      expect(result.current.currentGroup).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Fetch Groups', () => {
    it('should fetch groups successfully', async () => {
      const mockGroups = [
        {
          _id: '1',
          name: 'Group 1',
          type: 'tontine' as const,
          balance: 1000,
          members: [],
          createdAt: new Date().toISOString(),
        },
        {
          _id: '2',
          name: 'Group 2',
          type: 'saving' as const,
          balance: 2000,
          members: [],
          createdAt: new Date().toISOString(),
        },
      ];

      (groupService.getMyGroups as jest.Mock).mockResolvedValue(mockGroups);

      const { result } = renderHook(() => useGroupStore());

      await act(async () => {
        await result.current.fetchGroups();
      });

      expect(result.current.groups).toEqual(mockGroups);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(groupService.getMyGroups).toHaveBeenCalledTimes(1);
    });

    it('should handle fetch groups error', async () => {
      const errorMessage = 'Failed to fetch groups';
      (groupService.getMyGroups as jest.Mock).mockRejectedValue({
        response: { data: { message: errorMessage } },
      });

      const { result } = renderHook(() => useGroupStore());

      await act(async () => {
        await result.current.fetchGroups();
      });

      expect(result.current.groups).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe('Fetch Group By ID', () => {
    it('should fetch group by ID successfully', async () => {
      const mockGroup = {
        _id: '1',
        name: 'Group 1',
        type: 'tontine' as const,
        balance: 1000,
        members: [],
        createdAt: new Date().toISOString(),
      };

      (groupService.getGroupById as jest.Mock).mockResolvedValue(mockGroup);

      const { result } = renderHook(() => useGroupStore());

      await act(async () => {
        await result.current.fetchGroupById('1');
      });

      expect(result.current.currentGroup).toEqual(mockGroup);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(groupService.getGroupById).toHaveBeenCalledWith('1');
    });

    it('should handle fetch group by ID error', async () => {
      const errorMessage = 'Group not found';
      (groupService.getGroupById as jest.Mock).mockRejectedValue({
        response: { data: { message: errorMessage } },
      });

      const { result } = renderHook(() => useGroupStore());

      await act(async () => {
        await result.current.fetchGroupById('999');
      });

      expect(result.current.currentGroup).toBeNull();
      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe('Create Group', () => {
    it('should create group successfully', async () => {
      const newGroupData = {
        name: 'New Group',
        type: 'tontine' as const,
        contributionAmount: 1000,
        frequency: 'monthly' as const,
      };

      const mockCreatedGroup = {
        _id: '3',
        name: 'New Group',
        type: 'tontine' as const,
        balance: 0,
        members: [],
        createdAt: new Date().toISOString(),
      };

      (groupService.createGroup as jest.Mock).mockResolvedValue(mockCreatedGroup);

      const { result } = renderHook(() => useGroupStore());

      let createdGroup;
      await act(async () => {
        createdGroup = await result.current.createGroup(newGroupData);
      });

      expect(createdGroup).toEqual(mockCreatedGroup);
      expect(result.current.groups).toContainEqual(mockCreatedGroup);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(groupService.createGroup).toHaveBeenCalledWith(newGroupData);
    });

    it('should handle create group error', async () => {
      const errorMessage = 'Failed to create group';
      (groupService.createGroup as jest.Mock).mockRejectedValue({
        response: { data: { message: errorMessage } },
      });

      const { result } = renderHook(() => useGroupStore());

      await act(async () => {
        try {
          await result.current.createGroup({
            name: 'Test',
            type: 'tontine',
            contributionAmount: 1000,
            frequency: 'monthly',
          });
        } catch {
          // Expected to throw
        }
      });

      expect(result.current.groups).toEqual([]);
      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe('Update Group', () => {
    it('should update group successfully', async () => {
      const initialGroup = {
        _id: '1',
        name: 'Old Name',
        type: 'tontine' as const,
        balance: 1000,
        members: [],
        createdAt: new Date().toISOString(),
      };

      const updatedGroup = {
        ...initialGroup,
        name: 'New Name',
      };

      (groupService.updateGroup as jest.Mock).mockResolvedValue(updatedGroup);

      const { result } = renderHook(() => useGroupStore());

      // Set initial group
      act(() => {
        useGroupStore.setState({ groups: [initialGroup] });
      });

      await act(async () => {
        await result.current.updateGroup('1', { name: 'New Name' });
      });

      expect(result.current.groups[0].name).toBe('New Name');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Delete Group', () => {
    it('should delete group successfully', async () => {
      const group1 = {
        _id: '1',
        name: 'Group 1',
        type: 'tontine' as const,
        balance: 1000,
        members: [],
        createdAt: new Date().toISOString(),
      };

      const group2 = {
        _id: '2',
        name: 'Group 2',
        type: 'saving' as const,
        balance: 2000,
        members: [],
        createdAt: new Date().toISOString(),
      };

      (groupService.deleteGroup as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useGroupStore());

      // Set initial groups
      act(() => {
        useGroupStore.setState({ groups: [group1, group2] });
      });

      await act(async () => {
        await result.current.deleteGroup('1');
      });

      expect(result.current.groups).toHaveLength(1);
      expect(result.current.groups[0]._id).toBe('2');
      expect(result.current.isLoading).toBe(false);
      expect(groupService.deleteGroup).toHaveBeenCalledWith('1');
    });
  });

  describe('Clear Error', () => {
    it('should clear error', () => {
      const { result } = renderHook(() => useGroupStore());

      act(() => {
        useGroupStore.setState({ error: 'Some error' });
      });

      expect(result.current.error).toBe('Some error');

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('Set Current Group', () => {
    it('should set current group', () => {
      const mockGroup = {
        _id: '1',
        name: 'Group 1',
        type: 'tontine' as const,
        balance: 1000,
        members: [],
        createdAt: new Date().toISOString(),
      };

      const { result } = renderHook(() => useGroupStore());

      act(() => {
        result.current.setCurrentGroup(mockGroup);
      });

      expect(result.current.currentGroup).toEqual(mockGroup);
    });

    it('should set current group to null', () => {
      const { result } = renderHook(() => useGroupStore());

      act(() => {
        result.current.setCurrentGroup(null);
      });

      expect(result.current.currentGroup).toBeNull();
    });
  });
});
