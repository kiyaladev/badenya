import { useId } from 'react';
import ConfirmationModal from './ConfirmationModal';

export default function ConfirmActionModal({ title, message, confirmLabel, onConfirm, onCancel }: {
  title: string; message: string; confirmLabel: string; onConfirm: () => void; onCancel: () => void;
}) {
  const id = useId();
  return (
    <ConfirmationModal id={id} title={title} onClose={onCancel}>
      <p className="text-gray-600 mb-6">{message}</p>
      <div className="flex justify-end space-x-3">
        <button onClick={onCancel} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Annuler</button>
        <button onClick={onConfirm} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium">{confirmLabel}</button>
      </div>
    </ConfirmationModal>
  );
}
