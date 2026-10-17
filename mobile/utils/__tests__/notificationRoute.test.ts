import { notificationRoute } from '../notificationRoute';
describe('Notification destination', () => {
  it('opens the proposal when an event contains both proposal and group', () => {
    expect(notificationRoute({ groupId: 'group123', proposalId: 'proposal123' })).toBe(
      '/(screens)/proposal-details?id=proposal123'
    );
  });
  it('opens a transaction before its group', () => {
    expect(notificationRoute({ groupId: 'group123', transactionId: 'transaction123' })).toBe(
      '/(screens)/transaction-details?id=transaction123'
    );
  });
  it('rejects malformed targets', () => {
    expect(notificationRoute({ proposalId: '../login' })).toBeNull();
  });
});
