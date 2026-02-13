import api from './api';

export interface Group {
  _id: string;
  name: string;
  description?: string;
  type: 'tontine' | 'saving' | 'investment' | 'loan';
  contributionAmount: number;
  frequency: 'weekly' | 'monthly' | 'custom';
  members: GroupMember[];
  balance: number;
  currency: string;
  createdAt: string;
  nextContributionDate?: string;
}

export interface GroupMember {
  userId: string;
  role: 'admin' | 'treasurer' | 'member';
  joinedAt: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
}

export interface CreateGroupData {
  name: string;
  description?: string;
  type: 'tontine' | 'saving' | 'investment' | 'loan';
  contributionAmount: number;
  frequency: 'weekly' | 'monthly' | 'custom';
  currency?: string;
}

export interface UpdateGroupData {
  name?: string;
  description?: string;
  contributionAmount?: number;
  frequency?: 'weekly' | 'monthly' | 'custom';
}

class GroupService {
  /**
   * Get all groups for the current user
   */
  async getMyGroups(): Promise<Group[]> {
    const response = await api.get('/groups');
    return response.data;
  }

  /**
   * Get a specific group by ID
   */
  async getGroupById(groupId: string): Promise<Group> {
    const response = await api.get(`/groups/${groupId}`);
    return response.data;
  }

  /**
   * Create a new group
   */
  async createGroup(data: CreateGroupData): Promise<Group> {
    const response = await api.post('/groups', data);
    return response.data;
  }

  /**
   * Update a group
   */
  async updateGroup(groupId: string, data: UpdateGroupData): Promise<Group> {
    const response = await api.put(`/groups/${groupId}`, data);
    return response.data;
  }

  /**
   * Delete/Archive a group
   */
  async deleteGroup(groupId: string): Promise<void> {
    await api.delete(`/groups/${groupId}`);
  }

  /**
   * Add a member to a group
   */
  async addMember(groupId: string, userId: string): Promise<void> {
    await api.post(`/groups/${groupId}/members`, { userId });
  }

  /**
   * Remove a member from a group
   */
  async removeMember(groupId: string, userId: string): Promise<void> {
    await api.delete(`/groups/${groupId}/members/${userId}`);
  }

  /**
   * Update member role
   */
  async updateMemberRole(
    groupId: string,
    userId: string,
    role: 'admin' | 'treasurer' | 'member'
  ): Promise<void> {
    await api.put(`/groups/${groupId}/members/${userId}/role`, { role });
  }
}

export default new GroupService();
