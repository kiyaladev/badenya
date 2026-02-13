import { useProposalStore } from '../proposalStore';
import proposalService from '@/services/proposal.service';

// Mock the proposal service
jest.mock('@/services/proposal.service', () => ({
  __esModule: true,
  default: {
    getGroupProposals: jest.fn(),
    getProposalById: jest.fn(),
    createProposal: jest.fn(),
    voteOnProposal: jest.fn(),
    executeProposal: jest.fn(),
    cancelProposal: jest.fn(),
  },
}));

describe('ProposalStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useProposalStore.setState({
      proposals: [],
      currentProposal: null,
      isLoading: false,
      error: null,
    });
    jest.clearAllMocks();
  });

  describe('fetchGroupProposals', () => {
    it('should fetch proposals successfully', async () => {
      const mockProposals = [
        {
          _id: '1',
          groupId: 'group1',
          title: 'Test Proposal',
          description: 'Test description',
          type: 'expense' as const,
          status: 'active' as const,
          createdBy: 'user1',
          createdAt: new Date().toISOString(),
        },
      ];

      (proposalService.getGroupProposals as jest.Mock).mockResolvedValue(mockProposals);

      await useProposalStore.getState().fetchGroupProposals('group1');

      expect(proposalService.getGroupProposals).toHaveBeenCalledWith('group1');
      expect(useProposalStore.getState().proposals).toEqual(mockProposals);
      expect(useProposalStore.getState().isLoading).toBe(false);
      expect(useProposalStore.getState().error).toBeNull();
    });

    it('should handle fetch errors', async () => {
      const errorMessage = 'Network error';
      (proposalService.getGroupProposals as jest.Mock).mockRejectedValue({
        response: { data: { message: errorMessage } },
      });

      await useProposalStore.getState().fetchGroupProposals('group1');

      expect(useProposalStore.getState().proposals).toEqual([]);
      expect(useProposalStore.getState().error).toBe(errorMessage);
    });
  });

  describe('fetchProposalById', () => {
    it('should fetch single proposal successfully', async () => {
      const mockProposal = {
        _id: '1',
        groupId: 'group1',
        title: 'Test Proposal',
        description: 'Test description',
        type: 'expense' as const,
        status: 'active' as const,
        createdBy: 'user1',
        createdAt: new Date().toISOString(),
      };

      (proposalService.getProposalById as jest.Mock).mockResolvedValue(mockProposal);

      await useProposalStore.getState().fetchProposalById('1');

      expect(proposalService.getProposalById).toHaveBeenCalledWith('1');
      expect(useProposalStore.getState().currentProposal).toEqual(mockProposal);
      expect(useProposalStore.getState().isLoading).toBe(false);
    });

    it('should handle fetch errors', async () => {
      (proposalService.getProposalById as jest.Mock).mockRejectedValue(new Error('Not found'));

      await useProposalStore.getState().fetchProposalById('999');

      expect(useProposalStore.getState().currentProposal).toBeNull();
      expect(useProposalStore.getState().error).toBeTruthy();
    });
  });

  describe('createProposal', () => {
    it('should create proposal successfully', async () => {
      const newProposalData = {
        title: 'New Proposal',
        description: 'New description',
        type: 'expense' as const,
        amount: 5000,
      };

      const createdProposal = {
        _id: '2',
        groupId: 'group1',
        ...newProposalData,
        status: 'active' as const,
        createdBy: 'user1',
        createdAt: new Date().toISOString(),
      };

      (proposalService.createProposal as jest.Mock).mockResolvedValue(createdProposal);

      const result = await useProposalStore.getState().createProposal('group1', newProposalData);

      expect(proposalService.createProposal).toHaveBeenCalledWith('group1', newProposalData);
      expect(result).toEqual(createdProposal);
      expect(useProposalStore.getState().proposals).toContain(createdProposal);
      expect(useProposalStore.getState().isLoading).toBe(false);
    });

    it('should add new proposal to beginning of list', async () => {
      const existingProposal = {
        _id: '1',
        groupId: 'group1',
        title: 'Existing',
        description: 'Description',
        type: 'expense' as const,
        status: 'active' as const,
        createdBy: 'user1',
        createdAt: new Date().toISOString(),
      };

      useProposalStore.setState({ proposals: [existingProposal] });

      const newProposal = {
        _id: '2',
        groupId: 'group1',
        title: 'New',
        description: 'Description',
        type: 'expense' as const,
        status: 'active' as const,
        createdBy: 'user1',
        createdAt: new Date().toISOString(),
      };

      (proposalService.createProposal as jest.Mock).mockResolvedValue(newProposal);

      await useProposalStore.getState().createProposal('group1', {
        title: 'New',
        description: 'Description',
        type: 'expense',
      });

      const proposals = useProposalStore.getState().proposals;
      expect(proposals[0]).toEqual(newProposal);
      expect(proposals.length).toBe(2);
    });

    it('should handle creation errors and throw', async () => {
      const errorMessage = 'Unauthorized';
      (proposalService.createProposal as jest.Mock).mockRejectedValue({
        response: { data: { message: errorMessage } },
      });

      await expect(
        useProposalStore.getState().createProposal('group1', {
          title: 'Test',
          description: 'Test',
          type: 'expense',
        })
      ).rejects.toEqual({
        response: { data: { message: errorMessage } },
      });

      expect(useProposalStore.getState().error).toBe(errorMessage);
    });
  });

  describe('voteOnProposal', () => {
    it('should vote on proposal successfully', async () => {
      const mockProposal = {
        _id: '1',
        groupId: 'group1',
        title: 'Test',
        description: 'Description',
        type: 'expense' as const,
        status: 'active' as const,
        createdBy: 'user1',
        votes: {
          yes: 2,
          no: 0,
          abstain: 0,
        },
        createdAt: new Date().toISOString(),
      };

      (proposalService.voteOnProposal as jest.Mock).mockResolvedValue(mockProposal);

      useProposalStore.setState({
        proposals: [{ ...mockProposal, votes: { yes: 1, no: 0, abstain: 0 } }],
      });

      await useProposalStore.getState().voteOnProposal('1', { vote: 'yes' });

      expect(proposalService.voteOnProposal).toHaveBeenCalledWith('1', { vote: 'yes' });
      expect(useProposalStore.getState().proposals[0].votes.yes).toBe(2);
      expect(useProposalStore.getState().isLoading).toBe(false);
    });

    it('should handle vote errors and throw', async () => {
      (proposalService.voteOnProposal as jest.Mock).mockRejectedValue(new Error('Already voted'));

      await expect(
        useProposalStore.getState().voteOnProposal('1', { vote: 'yes' })
      ).rejects.toThrow('Already voted');

      expect(useProposalStore.getState().error).toBeTruthy();
    });
  });

  describe('executeProposal', () => {
    it('should execute proposal successfully', async () => {
      const mockProposal = {
        _id: '1',
        groupId: 'group1',
        title: 'Test',
        description: 'Description',
        type: 'expense' as const,
        status: 'executed' as const,
        createdBy: 'user1',
        createdAt: new Date().toISOString(),
      };

      (proposalService.executeProposal as jest.Mock).mockResolvedValue(mockProposal);

      useProposalStore.setState({
        proposals: [{ ...mockProposal, status: 'active' as const }],
      });

      await useProposalStore.getState().executeProposal('1');

      expect(proposalService.executeProposal).toHaveBeenCalledWith('1');
      expect(useProposalStore.getState().proposals[0].status).toBe('executed');
    });

    it('should handle execute errors and throw', async () => {
      (proposalService.executeProposal as jest.Mock).mockRejectedValue(
        new Error('Not enough votes')
      );

      await expect(useProposalStore.getState().executeProposal('1')).rejects.toThrow(
        'Not enough votes'
      );

      expect(useProposalStore.getState().error).toBeTruthy();
    });
  });

  describe('cancelProposal', () => {
    it('should cancel proposal successfully by removing it', async () => {
      const mockProposal = {
        _id: '1',
        groupId: 'group1',
        title: 'Test',
        description: 'Description',
        type: 'expense' as const,
        status: 'active' as const,
        createdBy: 'user1',
        createdAt: new Date().toISOString(),
      };

      (proposalService.cancelProposal as jest.Mock).mockResolvedValue(undefined);

      useProposalStore.setState({
        proposals: [mockProposal],
      });

      await useProposalStore.getState().cancelProposal('1');

      expect(proposalService.cancelProposal).toHaveBeenCalledWith('1');
      expect(useProposalStore.getState().proposals).toHaveLength(0);
      expect(useProposalStore.getState().currentProposal).toBeNull();
    });
  });

  describe('utility methods', () => {
    it('should clear error', () => {
      useProposalStore.setState({ error: 'Some error' });

      useProposalStore.getState().clearError();

      expect(useProposalStore.getState().error).toBeNull();
    });

    it('should set current proposal', () => {
      const proposal = {
        _id: '1',
        groupId: 'group1',
        title: 'Test',
        description: 'Description',
        type: 'expense' as const,
        status: 'active' as const,
        createdBy: 'user1',
        createdAt: new Date().toISOString(),
      };

      useProposalStore.getState().setCurrentProposal(proposal);

      expect(useProposalStore.getState().currentProposal).toEqual(proposal);
    });

    it('should clear current proposal', () => {
      useProposalStore.setState({
        currentProposal: {
          _id: '1',
          groupId: 'group1',
          title: 'Test',
          description: 'Description',
          type: 'expense',
          status: 'active',
          createdBy: 'user1',
          createdAt: new Date().toISOString(),
        },
      });

      useProposalStore.getState().setCurrentProposal(null);

      expect(useProposalStore.getState().currentProposal).toBeNull();
    });
  });
});
