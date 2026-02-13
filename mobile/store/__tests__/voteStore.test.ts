import { useVoteStore } from '../voteStore';
import voteService from '@/services/vote.service';

// Mock the vote service
jest.mock('@/services/vote.service', () => ({
  __esModule: true,
  default: {
    getGroupVotes: jest.fn(),
    getVoteById: jest.fn(),
    createVote: jest.fn(),
    castVote: jest.fn(),
    closeVote: jest.fn(),
    deleteVote: jest.fn(),
  },
}));

describe('VoteStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useVoteStore.setState({
      votes: [],
      currentVote: null,
      isLoading: false,
      error: null,
    });
    jest.clearAllMocks();
  });

  describe('fetchGroupVotes', () => {
    it('should fetch votes successfully', async () => {
      const mockVotes = [
        {
          _id: '1',
          proposalId: 'proposal1',
          userId: 'user1',
          vote: 'yes' as const,
          createdAt: new Date().toISOString(),
        },
        {
          _id: '2',
          proposalId: 'proposal1',
          userId: 'user2',
          vote: 'no' as const,
          createdAt: new Date().toISOString(),
        },
      ];

      (voteService.getGroupVotes as jest.Mock).mockResolvedValue(mockVotes);

      await useVoteStore.getState().fetchGroupVotes('group1');

      expect(voteService.getGroupVotes).toHaveBeenCalledWith('group1');
      expect(useVoteStore.getState().votes).toEqual(mockVotes);
      expect(useVoteStore.getState().isLoading).toBe(false);
      expect(useVoteStore.getState().error).toBeNull();
    });

    it('should handle fetch errors', async () => {
      const errorMessage = 'Network error';
      (voteService.getGroupVotes as jest.Mock).mockRejectedValue({
        response: { data: { message: errorMessage } },
      });

      await useVoteStore.getState().fetchGroupVotes('group1');

      expect(useVoteStore.getState().votes).toEqual([]);
      expect(useVoteStore.getState().error).toBe(errorMessage);
    });
  });

  describe('fetchVoteById', () => {
    it('should fetch single vote successfully', async () => {
      const mockVote = {
        _id: '1',
        proposalId: 'proposal1',
        userId: 'user1',
        vote: 'yes' as const,
        createdAt: new Date().toISOString(),
      };

      (voteService.getVoteById as jest.Mock).mockResolvedValue(mockVote);

      await useVoteStore.getState().fetchVoteById('1');

      expect(voteService.getVoteById).toHaveBeenCalledWith('1');
      expect(useVoteStore.getState().currentVote).toEqual(mockVote);
      expect(useVoteStore.getState().isLoading).toBe(false);
    });

    it('should handle fetch errors', async () => {
      (voteService.getVoteById as jest.Mock).mockRejectedValue(new Error('Not found'));

      await useVoteStore.getState().fetchVoteById('999');

      expect(useVoteStore.getState().currentVote).toBeNull();
      expect(useVoteStore.getState().error).toBeTruthy();
    });
  });

  describe('createVote', () => {
    it('should create vote successfully', async () => {
      const newVoteData = {
        proposalId: 'proposal1',
        vote: 'yes' as const,
      };

      const createdVote = {
        _id: '3',
        ...newVoteData,
        userId: 'user1',
        createdAt: new Date().toISOString(),
      };

      (voteService.createVote as jest.Mock).mockResolvedValue(createdVote);

      const result = await useVoteStore.getState().createVote('group1', newVoteData);

      expect(voteService.createVote).toHaveBeenCalledWith('group1', newVoteData);
      expect(result).toEqual(createdVote);
      expect(useVoteStore.getState().votes).toContain(createdVote);
      expect(useVoteStore.getState().isLoading).toBe(false);
    });

    it('should add new vote to beginning of list', async () => {
      const existingVote = {
        _id: '1',
        proposalId: 'proposal1',
        userId: 'user1',
        vote: 'yes' as const,
        createdAt: new Date().toISOString(),
      };

      useVoteStore.setState({ votes: [existingVote] });

      const newVote = {
        _id: '2',
        proposalId: 'proposal1',
        userId: 'user2',
        vote: 'no' as const,
        createdAt: new Date().toISOString(),
      };

      (voteService.createVote as jest.Mock).mockResolvedValue(newVote);

      await useVoteStore.getState().createVote('group1', {
        proposalId: 'proposal1',
        vote: 'no',
      });

      const votes = useVoteStore.getState().votes;
      expect(votes[0]).toEqual(newVote);
      expect(votes.length).toBe(2);
    });

    it('should handle creation errors and throw', async () => {
      const errorMessage = 'Already voted';
      (voteService.createVote as jest.Mock).mockRejectedValue({
        response: { data: { message: errorMessage } },
      });

      await expect(
        useVoteStore.getState().createVote('group1', {
          proposalId: 'proposal1',
          vote: 'yes',
        })
      ).rejects.toEqual({
        response: { data: { message: errorMessage } },
      });

      expect(useVoteStore.getState().error).toBe(errorMessage);
    });
  });

  describe('castVote', () => {
    it('should cast vote successfully', async () => {
      const mockVote = {
        _id: '1',
        proposalId: 'proposal1',
        userId: 'user1',
        vote: 'yes' as const,
        createdAt: new Date().toISOString(),
      };

      (voteService.castVote as jest.Mock).mockResolvedValue(mockVote);

      useVoteStore.setState({
        votes: [{ ...mockVote, vote: 'abstain' as const }],
      });

      await useVoteStore.getState().castVote('1', { vote: 'yes' });

      expect(voteService.castVote).toHaveBeenCalledWith('1', { vote: 'yes' });
      expect(useVoteStore.getState().votes[0].vote).toBe('yes');
      expect(useVoteStore.getState().currentVote).toEqual(mockVote);
      expect(useVoteStore.getState().isLoading).toBe(false);
    });

    it('should handle cast vote errors and throw', async () => {
      (voteService.castVote as jest.Mock).mockRejectedValue(new Error('Voting closed'));

      await expect(useVoteStore.getState().castVote('1', { vote: 'yes' })).rejects.toThrow(
        'Voting closed'
      );

      expect(useVoteStore.getState().error).toBeTruthy();
    });
  });

  describe('closeVote', () => {
    it('should close vote successfully', async () => {
      const mockVote = {
        _id: '1',
        proposalId: 'proposal1',
        userId: 'user1',
        vote: 'yes' as const,
        status: 'closed' as const,
        createdAt: new Date().toISOString(),
      };

      (voteService.closeVote as jest.Mock).mockResolvedValue(mockVote);

      useVoteStore.setState({
        votes: [{ ...mockVote, status: 'active' as const }],
      });

      await useVoteStore.getState().closeVote('1');

      expect(voteService.closeVote).toHaveBeenCalledWith('1');
      expect(useVoteStore.getState().votes[0].status).toBe('closed');
      expect(useVoteStore.getState().currentVote).toEqual(mockVote);
    });

    it('should handle close vote errors and throw', async () => {
      (voteService.closeVote as jest.Mock).mockRejectedValue(new Error('Unauthorized'));

      await expect(useVoteStore.getState().closeVote('1')).rejects.toThrow('Unauthorized');

      expect(useVoteStore.getState().error).toBeTruthy();
    });
  });

  describe('deleteVote', () => {
    it('should delete vote successfully', async () => {
      const vote1 = {
        _id: '1',
        proposalId: 'proposal1',
        userId: 'user1',
        vote: 'yes' as const,
        createdAt: new Date().toISOString(),
      };

      const vote2 = {
        _id: '2',
        proposalId: 'proposal1',
        userId: 'user2',
        vote: 'no' as const,
        createdAt: new Date().toISOString(),
      };

      useVoteStore.setState({ votes: [vote1, vote2] });

      (voteService.deleteVote as jest.Mock).mockResolvedValue(undefined);

      await useVoteStore.getState().deleteVote('1');

      expect(voteService.deleteVote).toHaveBeenCalledWith('1');
      expect(useVoteStore.getState().votes).toHaveLength(1);
      expect(useVoteStore.getState().votes[0]._id).toBe('2');
      expect(useVoteStore.getState().currentVote).toBeNull();
    });

    it('should handle delete errors and throw', async () => {
      (voteService.deleteVote as jest.Mock).mockRejectedValue(new Error('Unauthorized'));

      await expect(useVoteStore.getState().deleteVote('1')).rejects.toThrow('Unauthorized');

      expect(useVoteStore.getState().error).toBeTruthy();
    });
  });

  describe('utility methods', () => {
    it('should clear error', () => {
      useVoteStore.setState({ error: 'Some error' });

      useVoteStore.getState().clearError();

      expect(useVoteStore.getState().error).toBeNull();
    });

    it('should set current vote', () => {
      const vote = {
        _id: '1',
        proposalId: 'proposal1',
        userId: 'user1',
        vote: 'yes' as const,
        createdAt: new Date().toISOString(),
      };

      useVoteStore.getState().setCurrentVote(vote);

      expect(useVoteStore.getState().currentVote).toEqual(vote);
    });

    it('should clear current vote', () => {
      useVoteStore.setState({
        currentVote: {
          _id: '1',
          proposalId: 'proposal1',
          userId: 'user1',
          vote: 'yes',
          createdAt: new Date().toISOString(),
        },
      });

      useVoteStore.getState().setCurrentVote(null);

      expect(useVoteStore.getState().currentVote).toBeNull();
    });
  });
});
