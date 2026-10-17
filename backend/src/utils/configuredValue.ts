/** Reject documentation examples rather than advertising unavailable providers. */
export function isConfiguredValue(value: string | undefined): value is string {
  if (!value?.trim()) return false;
  return !/(?:your[_ -]|replace[_ -]?me|changeme|placeholder|[<][^>]+[>]|(?:^|[.@])example\.(?:com|org|net|test)(?:$|[:/]))/i.test(value);
}
