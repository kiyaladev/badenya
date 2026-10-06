import adminService from '../../services/adminService';
import api from '../../services/api';
jest.mock('../../services/api');
it('keeps currency volumes separate using the server aggregation contract', async () => {
  jest.mocked(api.get).mockResolvedValue({ data: { data: { totalTransactionVolume: 0, totalsByCurrency: [{ currency: 'XOF', totalTransactionVolume: 10000 }, { currency: 'EUR', totalTransactionVolume: 12 }] } } });
  const stats = await adminService.getDashboardStats();
  expect(stats.totalsByCurrency).toEqual({ XOF: 10000, EUR: 12 });
});
it('adapts the populated transaction references without losing currency or flags', async () => {
  const groupId = { _id: 'g', name: 'Group' }, initiatedBy = { _id: 'u', fullName: 'Known member' };
  jest.mocked(api.get).mockResolvedValue({ data: { data: { total: 1, transactions: [{ _id: 't', groupId, initiatedBy, currency: 'EUR', flagged: { reason: 'Check' } }] } } });
  const data = await adminService.getAllTransactions();
  expect(data.transactions[0]).toMatchObject({ group: groupId, user: initiatedBy, currency: 'EUR', flagged: { reason: 'Check' } });
});
