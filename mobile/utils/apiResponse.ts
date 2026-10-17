export interface ApiEnvelope<T> {
  status?: string;
  message?: string;
  data: T;
}

export function unwrapApiData<T>(payload: unknown): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data: T }).data;
  }

  return payload as T;
}

export function getEntityId(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);

  if (value && typeof value === 'object') {
    const entity = value as { _id?: unknown; id?: unknown };
    if (entity._id !== undefined) return getEntityId(entity._id);
    if (entity.id !== undefined) return getEntityId(entity.id);
  }

  return '';
}

export function getErrorStatus(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') return undefined;

  const response = (error as { response?: { status?: unknown } }).response;
  return typeof response?.status === 'number' ? response.status : undefined;
}
