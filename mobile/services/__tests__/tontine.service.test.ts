import tontineService, { TontineSchedule } from '../tontine.service';
import api from '../api';
jest.mock('../api', () => ({
  __esModule: true,
  default: { get: jest.fn(), put: jest.fn(), post: jest.fn() },
}));
const schedule: TontineSchedule = {
  groupId: 'group123',
  cycleNumber: 1,
  totalRounds: 2,
  currentRoundNumber: 1,
  contributionAmount: 100,
  potAmount: 200,
  frequency: 'monthly',
  revision: 1,
  updatedAt: '2026-10-06',
  rounds: [
    {
      roundId: 'round1',
      roundNumber: 1,
      beneficiaryId: 'member1',
      beneficiaryName: 'A',
      payoutDate: '2026-10-06',
      potAmount: 200,
      status: 'current',
    },
    {
      roundId: 'round2',
      roundNumber: 2,
      beneficiaryId: 'member2',
      beneficiaryName: 'B',
      payoutDate: '2026-11-06',
      potAmount: 200,
      status: 'upcoming',
    },
  ],
};
describe('Shared tontine calendar', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    (api.get as jest.Mock).mockResolvedValue({ data: { data: { schedule } } });
  });
  it('reads the server source of truth', async () => {
    expect(await tontineService.getTontineSchedule('group123')).toEqual(schedule);
    expect(api.get).toHaveBeenCalledWith('/groups/group123/tontine');
  });
  it('uses the same payout identity for retries of the same round', async () => {
    (api.post as jest.Mock).mockResolvedValue({ data: { data: { schedule } } });
    await tontineService.advanceToNextRound('group123');
    await tontineService.advanceToNextRound('group123');
    expect((api.post as jest.Mock).mock.calls[0]).toEqual((api.post as jest.Mock).mock.calls[1]);
    expect(api.post).toHaveBeenCalledWith('/groups/group123/tontine/payout', {
      roundId: 'round1',
      idempotencyKey: 'tontine:group123:1:round1',
    });
  });
  it('keeps the current beneficiary when reordered and sends revision', async () => {
    (api.put as jest.Mock).mockResolvedValue({ data: { data: { schedule } } });
    await tontineService.reorderRounds('group123', [...schedule.rounds].reverse());
    expect((api.put as jest.Mock).mock.calls[0][1]).toMatchObject({
      revision: 1,
      currentRoundNumber: 2,
    });
  });
  it('starts the next shared cycle only through the server', async () => {
    const next = { ...schedule, cycleNumber: 2 };
    (api.post as jest.Mock).mockResolvedValue({ data: { data: { schedule: next } } });
    expect(await tontineService.startNextCycle('group123')).toEqual(next);
    expect(api.post).toHaveBeenCalledWith('/groups/group123/tontine/next-cycle', {});
  });
  it('propagates a refused payout without claiming local completion', async () => {
    (api.post as jest.Mock).mockRejectedValue(new Error('Insufficient balance'));
    await expect(tontineService.advanceToNextRound('group123')).rejects.toThrow(
      'Insufficient balance'
    );
    expect(schedule.rounds[0].status).toBe('current');
  });
});
