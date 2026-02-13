import api from './api';

export interface Vote {
  _id: string;
  groupId: string;
  title: string;
  description: string;
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  type: 'simple' | 'quorum' | 'unanimous';
  quorumPercentage?: number;
  options: Array<{
    id: string;
    label: string;
    votes: number;
  }>;
  votes: Array<{
    userId: string;
    optionId: string;
    comment?: string;
    votedAt: string;
  }>;
  startDate: string;
  endDate: string;
  status: 'pending' | 'active' | 'closed' | 'executed';
  result?: {
    winningOptionId?: string;
    totalVotes: number;
    participationRate: number;
    votesPerOption: Record<string, number>;
    decidedAt: string;
  };
  allowChangeVote: boolean;
  anonymousVoting: boolean;
  showIntermediateResults: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVoteData {
  title: string;
  description: string;
  type?: 'simple' | 'quorum' | 'unanimous';
  quorumPercentage?: number;
  options: Array<{
    id: string;
    label: string;
  }>;
  endDate: string;
  allowChangeVote?: boolean;
  anonymousVoting?: boolean;
  showIntermediateResults?: boolean;
}

export interface CastVoteData {
  optionId: string;
  comment?: string;
}

class VoteService {
  /**
   * Get votes for a specific group
   */
  async getGroupVotes(groupId: string): Promise<Vote[]> {
    const response = await api.get(`/groups/${groupId}/votes`);
    return response.data.data.votes;
  }

  /**
   * Get a specific vote by ID
   */
  async getVoteById(voteId: string): Promise<Vote> {
    const response = await api.get(`/votes/${voteId}`);
    return response.data.data.vote;
  }

  /**
   * Create a new vote
   */
  async createVote(groupId: string, data: CreateVoteData): Promise<Vote> {
    const response = await api.post(`/groups/${groupId}/votes`, data);
    return response.data.data.vote;
  }

  /**
   * Cast a vote on a poll
   */
  async castVote(voteId: string, data: CastVoteData): Promise<Vote> {
    const response = await api.post(`/votes/${voteId}/cast`, data);
    return response.data.data.vote;
  }

  /**
   * Close a vote (admin only)
   */
  async closeVote(voteId: string): Promise<Vote> {
    const response = await api.put(`/votes/${voteId}/close`);
    return response.data.data.vote;
  }

  /**
   * Delete a vote (admin only)
   */
  async deleteVote(voteId: string): Promise<void> {
    await api.delete(`/votes/${voteId}`);
  }
}

export default new VoteService();
