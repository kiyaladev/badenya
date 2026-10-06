import { Link } from 'react-router-dom';

export default function Footer() {
  return <footer className="bg-gray-900 text-gray-300">
    <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 sm:grid-cols-3 gap-8">
      <div><p className="font-bold text-2xl text-white mb-4">Badenya</p><p>Gérez les cotisations, décisions et dépenses de vos groupes.</p></div>
      <div><h2 className="font-bold text-white mb-4">Produit</h2><ul className="space-y-3">
        <li><a href="/#features">Fonctionnalités</a></li><li><a href="/#how-it-works">Comment ça marche</a></li>
        <li><a href="https://badenya.naimba.com">Ouvrir l’application</a></li><li><Link to="/about">À propos</Link></li><li><Link to="/contact">Contact</Link></li>
      </ul></div>
      <div><h2 className="font-bold text-white mb-4">Informations</h2><ul className="space-y-3">
        <li><Link to="/terms">Conditions d’utilisation</Link></li><li><Link to="/privacy">Politique de confidentialité</Link></li>
      </ul></div>
      <p className="sm:col-span-3 border-t border-gray-700 pt-6 text-sm">© {new Date().getFullYear()} Badenya.</p>
    </div>
  </footer>;
}
