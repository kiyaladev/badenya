import { Share } from 'react-native';
import { Alert } from '@/services/dialog.service';
import groupService, { type Group } from '@/services/group.service';
import { getGroupTypeLabel } from '@/constants/labels';

/** Share a group invitation (code + summary) through the native share sheet. */
export async function shareGroupInvite(group: Group): Promise<void> {
  let inviteCode = group.invitationCode;
  try {
    inviteCode = inviteCode || (await groupService.invitationCode(group._id));
  } catch {
    Alert.alert(
      'Invitation indisponible',
      'Seul un administrateur peut obtenir le code du groupe.'
    );
    return;
  }
  const message =
    `Rejoignez mon groupe "${group.name}" sur l'application Badenya !\n\n` +
    `Type : ${getGroupTypeLabel(group.type)}\n` +
    `Cotisation : ${group.contributionAmount.toLocaleString()} ${group.currency}\n` +
    `Code du groupe : ${inviteCode}\n\n` +
    `Téléchargez Badenya pour participer aux tontines et épargnes solidaires en toute sécurité.`;
  try {
    await Share.share({ message, title: `Invitation au groupe ${group.name}` });
  } catch {
    // User cancelled
  }
}
