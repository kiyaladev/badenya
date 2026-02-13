import { create } from 'zustand';
import { getErrorMessage } from '../utils/errorHandler';
import proposalService, {
  Proposal,
  CreateProposalData,
  VoteOnProposalData,
} from '../services/proposal.service';

interface ProposalState {
  proposals: Proposal[];
  currentProposal: Proposal | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchGroupProposals: (groupId: string) => Promise<void>;
  fetchProposalById: (proposalId: string) => Promise<void>;
  createProposal: (groupId: string, data: CreateProposalData) => Promise<Proposal>;
  voteOnProposal: (proposalId: string, data: VoteOnProposalData) => Promise<void>;
  executeProposal: (proposalId: string) => Promise<void>;
  cancelProposal: (proposalId: string) => Promise<void>;
  clearError: () => void;
  setCurrentProposal: (proposal: Proposal | null) => void;
}

export const useProposalStore = create<ProposalState>((set, get) => ({
  proposals: [],
  currentProposal: null,
  isLoading: false,
  error: null,

  fetchGroupProposals: async (groupId: string) => {
    set({ isLoading: true, error: null });
    try {
      const proposals = await proposalService.getGroupProposals(groupId);
      set({ proposals, isLoading: false });
    } catch (error) {
      const errorMessage = getErrorMessage(error, 'Erreur lors du chargement des propositions');
      set({ error: errorMessage, isLoading: false });
    }
  },

  fetchProposalById: async (proposalId: string) => {
    set({ isLoading: true, error: null });
    try {
      const proposal = await proposalService.getProposalById(proposalId);
      set({ currentProposal: proposal, isLoading: false });
    } catch (error) {
      const errorMessage = getErrorMessage(error, 'Erreur lors du chargement de la proposition');
      set({ error: errorMessage, isLoading: false });
    }
  },

  createProposal: async (groupId: string, data: CreateProposalData) => {
    set({ isLoading: true, error: null });
    try {
      const newProposal = await proposalService.createProposal(groupId, data);
      const { proposals } = get();
      set({
        proposals: [newProposal, ...proposals],
        isLoading: false,
      });
      return newProposal;
    } catch (error) {
      const errorMessage = getErrorMessage(error, 'Erreur lors de la création de la proposition');
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  voteOnProposal: async (proposalId: string, data: VoteOnProposalData) => {
    set({ isLoading: true, error: null });
    try {
      const updatedProposal = await proposalService.voteOnProposal(proposalId, data);
      const { proposals } = get();
      set({
        proposals: proposals.map(p => (p._id === proposalId ? updatedProposal : p)),
        currentProposal: updatedProposal,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = getErrorMessage(error, 'Erreur lors du vote');
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  executeProposal: async (proposalId: string) => {
    set({ isLoading: true, error: null });
    try {
      const executedProposal = await proposalService.executeProposal(proposalId);
      const { proposals } = get();
      set({
        proposals: proposals.map(p => (p._id === proposalId ? executedProposal : p)),
        currentProposal: executedProposal,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = getErrorMessage(error, "Erreur lors de l'exécution de la proposition");
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  cancelProposal: async (proposalId: string) => {
    set({ isLoading: true, error: null });
    try {
      await proposalService.cancelProposal(proposalId);
      const { proposals } = get();
      set({
        proposals: proposals.filter(p => p._id !== proposalId),
        currentProposal: null,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = getErrorMessage(error, "Erreur lors de l'annulation de la proposition");
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  clearError: () => set({ error: null }),

  setCurrentProposal: (proposal: Proposal | null) => set({ currentProposal: proposal }),
}));
