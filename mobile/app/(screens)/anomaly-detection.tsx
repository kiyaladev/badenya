import { Redirect, useLocalSearchParams } from 'expo-router';
export default function RedirectAnalysis() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  return (
    <Redirect
      href={{ pathname: '/(screens)/group-insights', params: { groupId, section: 'anomalies' } }}
    />
  );
}
