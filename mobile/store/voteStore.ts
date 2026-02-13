import { create } from 'zustand';
import { getErrorMessage } from '../utils/errorHandler';
import voteService, { Vote, CreateVoteData, CastVoteData } from '../services/vote.service';

interface VoteState {
  votes: Vote[];
  currentVote: Vote | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchGroupVotes: (groupId: string) => Promise<void>;
  fetchVoteById: (voteId: string) => Promise<void>;
  createVote: (groupId: string, data: CreateVoteData) => Promise<Vote>;
  castVote: (voteId: string, data: CastVoteData) => Promise<void>;
  closeVote: (voteId: string) => Promise<void>;
  deleteVote: (voteId: string) => Promise<void>;
  clearError: () => void;
  setCurrentVote: (vote: Vote | null) => void;
}

export const useVoteStore = create<VoteState>((set, get) => ({
  votes: [],
  currentVote: null,
  isLoading: false,
  error: null,

  fetchGroupVotes: async (groupId: string) => {
    set({ isLoading: true, error: null });
    try {
      const votes = await voteService.getGroupVotes(groupId);
      set({ votes, isLoading: false });
    } catch (error) {
      const errorMessage = getErrorMessage(error, 'Erreur lors du chargement des votes');
      set({ error: errorMessage, isLoading: false });
    }
  },

  fetchVoteById: async (voteId: string) => {
    set({ isLoading: true, error: null });
    try {
      const vote = await voteService.getVoteById(voteId);
      set({ currentVote: vote, isLoading: false });
    } catch (error) {
      const errorMessage = getErrorMessage(error, 'Erreur lors du chargement du vote');
      set({ error: errorMessage, isLoading: false });
    }
  },

  createVote: async (groupId: string, data: CreateVoteData) => {
    set({ isLoading: true, error: null });
    try {
      const newVote = await voteService.createVote(groupId, data);
      const { votes } = get();
      set({
        votes: [newVote, ...votes],
        isLoading: false,
      });
      return newVote;
    } catch (error) {
      const errorMessage = getErrorMessage(error, 'Erreur lors de la création du vote');
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  castVote: async (voteId: string, data: CastVoteData) => {
    set({ isLoading: true, error: null });
    try {
      const updatedVote = await voteService.castVote(voteId, data);
      const { votes } = get();
      set({
        votes: votes.map(v => (v._id === voteId ? updatedVote : v)),
        currentVote: updatedVote,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = getErrorMessage(error, 'Erreur lors du vote');
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  closeVote: async (voteId: string) => {
    set({ isLoading: true, error: null });
    try {
      const closedVote = await voteService.closeVote(voteId);
      const { votes } = get();
      set({
        votes: votes.map(v => (v._id === voteId ? closedVote : v)),
        currentVote: closedVote,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = getErrorMessage(error, 'Erreur lors de la clôture du vote');
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  deleteVote: async (voteId: string) => {
    set({ isLoading: true, error: null });
    try {
      await voteService.deleteVote(voteId);
      const { votes } = get();
      set({
        votes: votes.filter(v => v._id !== voteId),
        currentVote: null,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = getErrorMessage(error, 'Erreur lors de la suppression du vote');
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  clearError: () => set({ error: null }),

  setCurrentVote: (vote: Vote | null) => set({ currentVote: vote }),
}));
