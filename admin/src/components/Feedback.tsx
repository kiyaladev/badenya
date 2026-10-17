export function LoadingState({ message = 'Chargement...' }: { message?: string }) {
  return <div role="status" className="bg-white rounded-lg p-8 text-center text-gray-700"><div aria-hidden="true" className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4" /><p>{message}</p></div>;
}
export function ErrorMessage({ message }: { message: string }) {
  return <div role="alert" className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">{message}</div>;
}
export function Toast({ notification, onClose }: { notification: { type: 'success' | 'error'; message: string }; onClose: () => void }) {
  return <div role="status" aria-live="polite" className={`fixed top-4 right-4 left-4 sm:left-auto sm:max-w-md z-50 p-4 rounded-lg shadow-lg border ${notification.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
    <div className="flex gap-3 justify-between"><p>{notification.message}</p><button onClick={onClose} aria-label="Fermer la notification">✕</button></div>
  </div>;
}
