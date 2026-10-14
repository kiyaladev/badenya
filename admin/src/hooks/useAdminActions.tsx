import { useState } from 'react';
import adminService from '../services/adminService';
import { getErrorMessage } from '../utils/errorHandler';
import ConfirmActionModal from '../components/ConfirmActionModal';

interface ActionCallbacks {
  onSuccess: (message: string) => void | Promise<void>;
  onError: (message: string) => void;
}

/** Suspend (with confirmation) / activate a user. Render `modal` in the page. */
export function useUserStatusActions({ onSuccess, onError }: ActionCallbacks) {
  const [pendingSuspend, setPendingSuspend] = useState<string | null>(null);

  const suspend = async (userId: string) => {
    setPendingSuspend(null);
    try {
      await adminService.suspendUser(userId);
      await onSuccess('Utilisateur suspendu avec succès');
    } catch (err) {
      onError(getErrorMessage(err) || 'Erreur lors de la suspension');
    }
  };

  const activate = async (userId: string) => {
    try {
      await adminService.activateUser(userId);
      await onSuccess('Utilisateur activé avec succès');
    } catch (err) {
      onError(getErrorMessage(err) || 'Erreur lors de l\'activation');
    }
  };

  const modal = pendingSuspend ? (
    <ConfirmActionModal
      title="Confirmer la suspension"
      message="Êtes-vous sûr de vouloir suspendre cet utilisateur ?"
      confirmLabel="Suspendre"
      onConfirm={() => void suspend(pendingSuspend)}
      onCancel={() => setPendingSuspend(null)}
    />
  ) : null;

  return { requestSuspend: setPendingSuspend, activate, modal };
}

/** Archive a group after confirmation. Render `modal` in the page. */
export function useArchiveGroupAction({ onSuccess, onError }: ActionCallbacks) {
  const [pendingArchive, setPendingArchive] = useState<string | null>(null);

  const archive = async (groupId: string) => {
    setPendingArchive(null);
    try {
      await adminService.archiveGroup(groupId);
      await onSuccess('Groupe archivé avec succès');
    } catch (err) {
      onError(getErrorMessage(err) || 'Erreur lors de l\'archivage');
    }
  };

  const modal = pendingArchive ? (
    <ConfirmActionModal
      title="Confirmer l'archivage"
      message="Êtes-vous sûr de vouloir archiver ce groupe ?"
      confirmLabel="Archiver"
      onConfirm={() => void archive(pendingArchive)}
      onCancel={() => setPendingArchive(null)}
    />
  ) : null;

  return { requestArchive: setPendingArchive, modal };
}
