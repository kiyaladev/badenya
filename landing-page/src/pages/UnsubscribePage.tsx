import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
export default function UnsubscribePage() {
  const [params] = useSearchParams(); const token = params.get('token');
  const [busy, setBusy] = useState(false); const [done, setDone] = useState(false); const [error, setError] = useState('');
  async function unsubscribe() {
    setBusy(true); setError('');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://badenya-api.naimba.com/api/v1'}/contact/newsletter/unsubscribe`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) });
      if (!response.ok) throw new Error(); setDone(true);
    } catch { setError('Impossible de traiter la demande. Réessayez ou contactez l’équipe.'); }
    finally { setBusy(false); }
  }
  return <><Navbar /><main className="max-w-xl mx-auto px-6 py-16 min-h-[60vh] space-y-6">
    <h1 className="text-3xl font-bold">Se désinscrire de la newsletter</h1>
    {!token ? <p role="alert">Utilisez le lien présent dans votre email ou contactez l’équipe pour vous désinscrire.</p> : done ? <p role="status">Votre demande de désinscription a été traitée.</p> : <><p>Confirmez pour désactiver l’inscription liée à ce lien.</p><button disabled={busy} onClick={() => void unsubscribe()} className="bg-blue-700 text-white rounded-lg p-3 disabled:opacity-60">{busy ? 'Traitement…' : 'Confirmer la désinscription'}</button></>}
    {error && <p role="alert" className="text-red-700">{error}</p>}
  </main><Footer /></>;
}
