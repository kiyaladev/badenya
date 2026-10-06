import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [done, setDone] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (password !== confirmation) { setMessage('Les mots de passe doivent être identiques.'); return; }
    setBusy(true); setMessage('');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://badenya-api.naimba.com/api/v1'}/auth/reset-password`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, newPassword: password }),
      });
      if (!response.ok) { const body = await response.json().catch(() => ({})); throw new Error(body.message || 'Le lien est invalide ou expiré. Demandez un nouveau lien depuis l’application.'); }
      setDone(true); setPassword(''); setConfirmation('');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Le service est inaccessible. Réessayez.'); }
    finally { setBusy(false); }
  }
  return <><Navbar /><main className="max-w-lg mx-auto px-6 py-16 min-h-[60vh]">
    <h1 className="text-3xl font-bold mb-6">Réinitialiser votre mot de passe</h1>
    {!token ? <p role="alert">Ce lien ne contient pas de jeton de réinitialisation. Demandez un nouveau lien depuis l’application.</p> : done ? <div role="status"><p>Votre mot de passe a été modifié.</p><a className="text-blue-700 underline" href="https://badenya.naimba.com">Ouvrir l’application pour vous connecter</a></div> : <form onSubmit={submit} className="space-y-5">
      <p>Choisissez au moins 8 caractères, avec une majuscule, une minuscule et un chiffre.</p>
      <label className="block">Nouveau mot de passe<input className="block w-full border border-gray-400 rounded-lg p-3 mt-2" type="password" autoComplete="new-password" required minLength={8} pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{8,}" value={password} onChange={e => setPassword(e.target.value)} /></label>
      <label className="block">Confirmer le mot de passe<input className="block w-full border border-gray-400 rounded-lg p-3 mt-2" type="password" autoComplete="new-password" required value={confirmation} onChange={e => setConfirmation(e.target.value)} /></label>
      {message && <p className="text-red-700" role="alert">{message}</p>}
      <button className="bg-blue-700 text-white rounded-lg p-3 disabled:opacity-60" disabled={busy}>{busy ? 'Enregistrement…' : 'Enregistrer le mot de passe'}</button>
    </form>}
  </main><Footer /></>;
}
