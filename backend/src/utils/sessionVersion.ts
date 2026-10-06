/** Legacy users are hydrated with version 0 but the stored field may be absent. */
export function sessionVersionQuery(version: number): Record<string, unknown> {
  return version
    ? { sessionVersion: version }
    : { $or: [{ sessionVersion: 0 }, { sessionVersion: { $exists: false } }] };
}
