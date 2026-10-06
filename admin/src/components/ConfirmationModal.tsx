import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useFocusTrap } from '../hooks/useFocusTrap';
export default function ConfirmationModal({ title, id, onClose, children }: { title: string; id: string; onClose: () => void; children: ReactNode }) {
  const ref = useFocusTrap<HTMLDivElement>(true);
  useEffect(() => {
    const root = document.getElementById('root');
    const previousInert = root?.inert;
    if (root) root.inert = true;
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('keydown', escape);
      if (root) root.inert = previousInert || false;
    };
  }, [onClose]);
  return createPortal(<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
    <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={id} onClick={event => event.stopPropagation()} className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm max-h-[90vh] overflow-y-auto">
      <h2 id={id} className="text-lg font-semibold text-gray-900 mb-2">{title}</h2>{children}
    </div>
  </div>, document.body);
}
