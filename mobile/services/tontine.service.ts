import api from './api';
import { unwrapApiData } from '@/utils/apiResponse';
import { Group, GroupMember } from './group.service';

export interface TontineRound {
  roundId?: string;
  roundNumber: number;
  beneficiaryId: string;
  beneficiaryName: string;
  beneficiaryAvatar?: string;
  payoutDate: string;
  potAmount: number;
  status: 'completed' | 'current' | 'upcoming';
  paidAt?: string;
  payoutTransactionId?: string;
}

export interface TontineSchedule {
  customIntervalDays?: number;
  revision?: number;
  groupId: string;
  cycleNumber: number;
  totalRounds: number;
  currentRoundNumber: number;
  contributionAmount: number;
  potAmount: number;
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
  rounds: TontineRound[];
  updatedAt: string;
}

class TontineService {
  public async getCycleHistory(groupId: string, page = 1): Promise<TontineSchedule[]> {
    return unwrapApiData<{ cycles: TontineSchedule[] }>(
      (await api.get(`/groups/${groupId}/tontine/history`, { params: { page } })).data
    ).cycles;
  }

  private calculatePayoutDate(
    startDate: Date,
    roundIndex: number,
    frequency: string,
    customIntervalDays?: number
  ): string {
    const date = new Date(startDate);
    if (frequency === 'daily') {
      date.setDate(date.getDate() + roundIndex);
    } else if (frequency === 'weekly') {
      date.setDate(date.getDate() + roundIndex * 7);
    } else if (frequency === 'custom') {
      if (!customIntervalDays || customIntervalDays < 1)
        throw new Error('Indiquez un intervalle personnalisé en jours.');
      date.setDate(date.getDate() + roundIndex * customIntervalDays);
    } else {
      const day = date.getDate();
      date.setDate(1);
      date.setMonth(date.getMonth() + roundIndex);
      const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
      date.setDate(Math.min(day, lastDay));
    }
    return date.toISOString();
  }

  public generateDefaultSchedule(group: Group, customIntervalDays?: number): TontineSchedule {
    const activeMembers = group.members.filter(
      member => !member.status || member.status === 'active'
    );
    const memberCount = activeMembers.length;
    if (!memberCount) throw new Error('Un membre actif est requis.');
    const potAmount = memberCount * group.contributionAmount;
    const baseDate = group.nextContributionDate ? new Date(group.nextContributionDate) : new Date();

    const rounds: TontineRound[] = activeMembers.map((member: GroupMember, idx: number) => ({
      roundNumber: idx + 1,
      beneficiaryId: member.userId,
      beneficiaryName: member.fullName || `Membre #${idx + 1}`,
      beneficiaryAvatar: member.avatar,
      payoutDate: this.calculatePayoutDate(baseDate, idx, group.frequency, customIntervalDays),
      potAmount,
      status: idx === 0 ? 'current' : 'upcoming',
    }));

    return {
      groupId: group._id,
      cycleNumber: 1,
      totalRounds: rounds.length,
      currentRoundNumber: 1,
      contributionAmount: group.contributionAmount,
      potAmount,
      frequency: group.frequency,
      customIntervalDays,
      rounds,
      updatedAt: new Date().toISOString(),
    };
  }

  public async getTontineSchedule(
    groupId: string,
    _group?: Group
  ): Promise<TontineSchedule | null> {
    return unwrapApiData<{ schedule: TontineSchedule | null }>(
      (await api.get(`/groups/${groupId}/tontine`)).data
    ).schedule;
  }
  public async saveTontineSchedule(schedule: TontineSchedule): Promise<void> {
    await api.put(`/groups/${schedule.groupId}/tontine`, schedule);
  }
  public async startNextCycle(groupId: string): Promise<TontineSchedule> {
    return unwrapApiData<{ schedule: TontineSchedule }>(
      (await api.post(`/groups/${groupId}/tontine/next-cycle`, {})).data
    ).schedule;
  }
  public async advanceToNextRound(groupId: string): Promise<TontineSchedule | null> {
    const schedule = await this.getTontineSchedule(groupId);
    const round = schedule?.rounds.find(round => round.status === 'current');
    if (!round) throw new Error('Aucun tour en cours à verser.');
    return this.markRoundPaid(groupId, round.roundNumber);
  }
  public async markRoundPaid(
    groupId: string,
    roundNumber: number,
    _transactionId?: string
  ): Promise<TontineSchedule | null> {
    const schedule = await this.getTontineSchedule(groupId);
    const round = schedule?.rounds.find(round => round.roundNumber === roundNumber);
    if (!round?.roundId) throw new Error('Rechargez le calendrier partagé avant le versement.');
    // Deterministic retry identity: one transfer for this round in this cycle.
    const idempotencyKey = `tontine:${groupId}:${schedule!.cycleNumber}:${round.roundId}`;
    return unwrapApiData<{ schedule: TontineSchedule }>(
      (
        await api.post(`/groups/${groupId}/tontine/payout`, {
          roundId: round.roundId,
          idempotencyKey,
        })
      ).data
    ).schedule;
  }
  public async reorderRounds(
    groupId: string,
    reorderedRounds: TontineRound[]
  ): Promise<TontineSchedule | null> {
    const schedule = await this.getTontineSchedule(groupId);
    if (!schedule) return null;
    const rounds = reorderedRounds.map((round, index) => ({ ...round, roundNumber: index + 1 }));
    const currentRoundNumber = rounds.find(round => round.status === 'current')?.roundNumber || 0;
    return unwrapApiData<{ schedule: TontineSchedule }>(
      (await api.put(`/groups/${groupId}/tontine`, { ...schedule, rounds, currentRoundNumber }))
        .data
    ).schedule;
  }
}
export default new TontineService();
