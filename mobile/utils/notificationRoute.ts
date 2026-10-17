export function notificationRoute(data?: Record<string, unknown>): string | null {
  const route = (screen: string, id: unknown) =>
    typeof id === 'string' && /^[a-zA-Z0-9_-]+$/.test(id)
      ? `/(screens)/${screen}?id=${encodeURIComponent(id)}`
      : null;
  return (
    route('proposal-details', data?.proposalId) ||
    route('transaction-details', data?.transactionId) ||
    route('group-details', data?.groupId)
  );
}
