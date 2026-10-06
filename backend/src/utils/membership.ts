import { IGroup } from "../models/Group";
/** Works for IDs and populated references without stringifying documents. */
export function entityId(value: unknown): string {
  if (!value) return "";
  if (typeof value === "object" && "_id" in value)
    return String((value as { _id: unknown })._id);
  return String(value);
}
export function activeMember(group: IGroup | null, userId: string) {
  if (!group || !group.isActive || group.archivedAt) return undefined;
  return group.members.find(
    (m) => entityId(m.userId) === userId && m.status === "active",
  );
}
