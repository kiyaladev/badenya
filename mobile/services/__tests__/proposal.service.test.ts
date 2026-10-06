import proposalService from '../proposal.service';
import api from '../api';
jest.mock('../api', () => ({ __esModule: true, default: { put: jest.fn() } }));
it('closes an expired proposal using the server PUT contract', async () => {
  (api.put as jest.Mock).mockResolvedValue({
    data: {
      data: { proposal: { _id: 'proposal1', groupId: 'group1', status: 'approved', votes: [] } },
    },
  });
  expect(await proposalService.closeProposal('proposal1')).toMatchObject({
    _id: 'proposal1',
    status: 'approved',
  });
  expect(api.put).toHaveBeenCalledWith('/proposals/proposal1/close');
});
