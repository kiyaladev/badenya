import { create } from 'zustand';
import { getErrorMessage } from '../utils/errorHandler';
import groupService, { Group, CreateGroupData, UpdateGroupData } from '../services/group.service';

interface GroupState {
  groups: Group[];
  currentGroup: Group | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchGroups: () => Promise<void>;
  fetchGroupById: (groupId: string) => Promise<void>;
  createGroup: (data: CreateGroupData) => Promise<Group>;
  updateGroup: (groupId: string, data: UpdateGroupData) => Promise<void>;
  deleteGroup: (groupId: string) => Promise<void>;
  clearError: () => void;
  setCurrentGroup: (group: Group | null) => void;
}

export const useGroupStore = create<GroupState>((set, get) => ({
  groups: [],
  currentGroup: null,
  isLoading: false,
  error: null,

  fetchGroups: async () => {
    set({ isLoading: true, error: null });
    try {
      const groups = await groupService.getMyGroups();
      set({ groups, isLoading: false });
    } catch (error) {
      const errorMessage = getErrorMessage(error, 'Erreur lors du chargement des groupes');
      set({ error: errorMessage, isLoading: false });
    }
  },

  fetchGroupById: async (groupId: string) => {
    set({ isLoading: true, error: null });
    try {
      const group = await groupService.getGroupById(groupId);
      set({ currentGroup: group, isLoading: false });
    } catch (error) {
      const errorMessage = getErrorMessage(error, 'Erreur lors du chargement du groupe');
      set({ error: errorMessage, isLoading: false });
    }
  },

  createGroup: async (data: CreateGroupData) => {
    set({ isLoading: true, error: null });
    try {
      const newGroup = await groupService.createGroup(data);
      const { groups } = get();
      set({
        groups: [...groups, newGroup],
        isLoading: false,
      });
      return newGroup;
    } catch (error) {
      const errorMessage = getErrorMessage(error, 'Erreur lors de la création du groupe');
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  updateGroup: async (groupId: string, data: UpdateGroupData) => {
    set({ isLoading: true, error: null });
    try {
      const updatedGroup = await groupService.updateGroup(groupId, data);
      const { groups } = get();
      set({
        groups: groups.map(g => (g._id === groupId ? updatedGroup : g)),
        currentGroup: updatedGroup,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = getErrorMessage(error, 'Erreur lors de la mise à jour du groupe');
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  deleteGroup: async (groupId: string) => {
    set({ isLoading: true, error: null });
    try {
      await groupService.deleteGroup(groupId);
      const { groups } = get();
      set({
        groups: groups.filter(g => g._id !== groupId),
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = getErrorMessage(error, 'Erreur lors de la suppression du groupe');
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  clearError: () => set({ error: null }),

  setCurrentGroup: (group: Group | null) => set({ currentGroup: group }),
}));
