import api from './api';

export interface Proposal {
  _id: string;
  groupId: string;
  title: string;
  description: string;
  amount: number;
  currency: string;
  recipient?: {
    userId?: string;
    name?: string;
    details?: string;
  };
  proposedBy: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  attachments: Array<{
    type: 'image' | 'document' | 'link';
    url: string;
    filename?: string;
    name: string;
  }>;
  category: 'loan' | 'investment' | 'charity' | 'event' | 'emergency' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  votes: Array<{
    userId: string;
    decision: 'for' | 'against' | 'abstain';
    comment?: string;
    votedAt: string;
  }>;
  votingDeadline: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired' | 'executed';
  result?: {
    totalVotes: number;
    votesFor: number;
    votesAgainst: number;
    votesAbstain: number;
    participationRate: number;
    decidedAt: string;
  };
  executedAt?: string;
  transactionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProposalData {
  title: string;
  description: string;
  amount: number;
  category: 'loan' | 'investment' | 'charity' | 'event' | 'emergency' | 'other';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  recipient?: {
    userId?: string;
    name?: string;
    details?: string;
  };
  votingDeadline: string;
}

export interface VoteOnProposalData {
  decision: 'for' | 'against' | 'abstain';
  comment?: string;
}

class ProposalService {
  /**
   * Get proposals for a specific group
   */
  async getGroupProposals(groupId: string): Promise<Proposal[]> {
    const response = await api.get(`/groups/${groupId}/proposals`);
    return response.data.data.proposals;
  }

  /**
   * Get a specific proposal by ID
   */
  async getProposalById(proposalId: string): Promise<Proposal> {
    const response = await api.get(`/proposals/${proposalId}`);
    return response.data.data.proposal;
  }

  /**
   * Create a new proposal
   */
  async createProposal(groupId: string, data: CreateProposalData): Promise<Proposal> {
    const response = await api.post(`/groups/${groupId}/proposals`, data);
    return response.data.data.proposal;
  }

  /**
   * Vote on a proposal
   */
  async voteOnProposal(proposalId: string, data: VoteOnProposalData): Promise<Proposal> {
    const response = await api.post(`/proposals/${proposalId}/vote`, data);
    return response.data.data.proposal;
  }

  /**
   * Execute an approved proposal
   */
  async executeProposal(proposalId: string): Promise<Proposal> {
    const response = await api.post(`/proposals/${proposalId}/execute`);
    return response.data.data.proposal;
  }

  /**
   * Cancel a proposal (only creator or admin)
   */
  async cancelProposal(proposalId: string): Promise<void> {
    await api.delete(`/proposals/${proposalId}`);
  }
}

export default new ProposalService();
