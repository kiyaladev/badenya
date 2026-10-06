import api from './api';
import { getEntityId, unwrapApiData } from '@/utils/apiResponse';

export const SUPPORTED_CURRENCIES = ['XOF', 'XAF', 'EUR', 'USD', 'GNF', 'CDF', 'MAD'] as const;
export type GroupType = 'tontine' | 'association' | 'family' | 'friends' | 'project';
export const GROUP_TYPE_LABELS: Record<GroupType, string> = {
  tontine: 'Tontine',
  association: 'Association',
  family: 'Famille',
  friends: 'Amis',
  project: 'Projet',
};
export type ContributionFrequency = 'daily' | 'weekly' | 'monthly' | 'custom';

export interface Group {
  _id: string;
  memberCount?: number;
  invitationCode?: string;
  stats?: { totalContributions: number; totalExpenses: number };
  name: string;
  description?: string;
  type: GroupType;
  contributionAmount: number;
  frequency: ContributionFrequency;
  contributionSettings: {
    amount: number;
    frequency: ContributionFrequency;
    dueDay?: number;
    autoReminder: boolean;
  };
  members: GroupMember[];
  balance: number;
  currency: string;
  createdAt: string;
  nextContributionDate?: string;
  avatar?: { url: string; filename: string };
}

export interface GroupMember {
  status?: 'active' | 'suspended' | 'left';
  userId: string;
  role: 'admin' | 'treasurer' | 'member';
  joinedAt: string;
  fullName?: string;
  email?: string;
  avatar?: string;
}

export interface CreateGroupData {
  avatar?: { url: string; filename: string };
  settings?: {
    isPrivate?: boolean;
    requireApprovalToJoin?: boolean;
    allowMemberProposals?: boolean;
    maxMembers?: number;
  };
  name: string;
  description?: string;
  type: GroupType;
  contributionSettings: {
    amount: number;
    frequency: ContributionFrequency;
    autoReminder?: boolean;
  };
  currency?: string;
}

export interface UpdateGroupData {
  name?: string;
  description?: string;
  type?: GroupType;
  contributionSettings?: Partial<CreateGroupData['contributionSettings']>;
  avatar?: { url: string; filename: string };
}

function normalizeMember(rawMember: unknown): GroupMember {
  const member = rawMember as {
    userId?: unknown;
    status?: GroupMember['status'];
    role?: unknown;
    joinedAt?: unknown;
    fullName?: unknown;
    email?: unknown;
    avatar?: unknown;
  };
  const user =
    member.userId && typeof member.userId === 'object'
      ? (member.userId as { _id?: unknown; fullName?: unknown; email?: unknown; avatar?: unknown })
      : undefined;
  const rawAvatar = user?.avatar ?? member.avatar;

  return {
    userId: getEntityId(member.userId),
    status: member.status || 'active',
    role: (member.role || 'member') as GroupMember['role'],
    joinedAt: String(member.joinedAt || new Date().toISOString()),
    fullName: String(user?.fullName ?? member.fullName ?? ''),
    email: user?.email ? String(user.email) : member.email ? String(member.email) : undefined,
    avatar:
      rawAvatar && typeof rawAvatar === 'object' && 'url' in rawAvatar
        ? String((rawAvatar as { url?: unknown }).url || '')
        : typeof rawAvatar === 'string'
          ? rawAvatar
          : undefined,
  };
}

export function normalizeGroup(rawGroup: unknown): Group {
  const raw = (rawGroup || {}) as {
    memberCount?: number;
    invitationCode?: string;
    stats?: Group['stats'];
    _id?: unknown;
    name?: unknown;
    description?: unknown;
    type?: unknown;
    contributionSettings?: Partial<Group['contributionSettings']>;
    contributionAmount?: unknown;
    frequency?: unknown;
    members?: unknown[];
    balance?: unknown;
    currency?: unknown;
    createdAt?: unknown;
    nextContributionDate?: unknown;
    avatar?: Group['avatar'];
  };
  const settings = raw.contributionSettings || {};
  const amount = Number(settings.amount ?? raw.contributionAmount ?? 0);
  const frequency = (settings.frequency ?? raw.frequency ?? 'monthly') as ContributionFrequency;

  return {
    _id: getEntityId(raw._id),
    invitationCode: raw.invitationCode,
    memberCount: raw.memberCount,
    stats: raw.stats,
    name: String(raw.name || ''),
    description: raw.description ? String(raw.description) : undefined,
    type: (raw.type || 'tontine') as GroupType,
    contributionAmount: amount,
    frequency,
    contributionSettings: {
      amount,
      frequency,
      dueDay: settings.dueDay,
      autoReminder: settings.autoReminder !== false,
    },
    members: (raw.members || []).map(normalizeMember),
    balance: Number(raw.balance || 0),
    currency: String(raw.currency || 'XOF'),
    createdAt: String(raw.createdAt || new Date().toISOString()),
    nextContributionDate: raw.nextContributionDate ? String(raw.nextContributionDate) : undefined,
    avatar: raw.avatar,
  };
}

class GroupService {
  async joinRequests(
    groupId: string
  ): Promise<
    Array<{ _id: string; userId: { fullName?: string; email?: string }; status?: string }>
  > {
    const data = unwrapApiData<{
      requests?: Array<{
        _id: string;
        userId: { fullName?: string; email?: string };
        status?: string;
      }>;
      joinRequests?: Array<{
        _id: string;
        userId: { fullName?: string; email?: string };
        status?: string;
      }>;
    }>((await api.get(`/groups/${groupId}/join-requests`)).data);
    return data.requests || data.joinRequests || [];
  }
  async reviewJoinRequest(
    groupId: string,
    requestId: string,
    decision: 'approve' | 'reject'
  ): Promise<void> {
    await api.post(`/groups/${groupId}/join-requests/${requestId}/${decision}`);
  }
  async invitationCode(groupId: string): Promise<string> {
    return unwrapApiData<{ code: string }>(
      (await api.get(`/groups/${groupId}/invitation-code`)).data
    ).code;
  }

  async discover(): Promise<Group[]> {
    const response = await api.get('/groups/discover');
    return (unwrapApiData<{ groups: unknown[] }>(response.data).groups || []).map(normalizeGroup);
  }
  async join(groupId: string): Promise<{ status: string; groupId: string }> {
    return unwrapApiData((await api.post(`/groups/${groupId}/join`, {})).data);
  }
  async joinByCode(code: string): Promise<{ status: string; groupId: string }> {
    return unwrapApiData(
      (await api.post('/groups/join', { code: code.trim().toLowerCase() })).data
    );
  }

  /**
   * Get all groups for the current user
   */
  async getMyGroups(): Promise<Group[]> {
    const response = await api.get('/groups');
    // Keep compatibility with older API adapters that returned the array directly.
    if (Array.isArray(response.data)) {
      return response.data as Group[];
    }
    const data = unwrapApiData<{ groups?: unknown[] }>(response.data);
    if (Array.isArray(data)) {
      return data as unknown as Group[];
    }
    return (data.groups || []).map(normalizeGroup);
  }

  /**
   * Get a specific group by ID
   */
  async getGroupById(groupId: string): Promise<Group> {
    const response = await api.get(`/groups/${groupId}`);
    if (response.data && typeof response.data === 'object' && !('data' in response.data)) {
      return response.data as Group;
    }
    const data = unwrapApiData<{ group: unknown }>(response.data);
    return normalizeGroup(data.group || data);
  }

  /**
   * Create a new group
   */
  async createGroup(data: CreateGroupData): Promise<Group> {
    const response = await api.post('/groups', data);
    if (response.data && typeof response.data === 'object' && !('data' in response.data)) {
      return response.data as Group;
    }
    const payload = unwrapApiData<{ group: unknown }>(response.data);
    return normalizeGroup(payload.group || payload);
  }

  /**
   * Update a group
   */
  async updateGroup(groupId: string, data: UpdateGroupData): Promise<Group> {
    const response = await api.put(`/groups/${groupId}`, data);
    if (response.data && typeof response.data === 'object' && !('data' in response.data)) {
      return response.data as Group;
    }
    const payload = unwrapApiData<{ group: unknown }>(response.data);
    return normalizeGroup(payload.group || payload);
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
