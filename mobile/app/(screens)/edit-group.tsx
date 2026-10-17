import { useLocalSearchParams } from 'expo-router';
import GroupForm from '@/components/GroupForm';

export default function EditGroupScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <GroupForm mode="edit" groupId={id} />;
}
