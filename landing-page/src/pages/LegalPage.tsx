import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function LegalPage({ privacy = false }: { privacy?: boolean }) {
  return <><Navbar /><main className="max-w-3xl mx-auto px-6 py-16 text-gray-800 space-y-6">
    <h1 className="text-3xl font-bold">{privacy ? 'Politique de confidentialité' : 'Conditions d’utilisation'}</h1>
    <p>Mise à jour : 6 octobre 2026.</p>
    {privacy ? <>
      <h2 className="text-xl font-bold">Données utilisées</h2><p>Badenya traite les informations de compte (nom, email, téléphone éventuellement fourni et mot de passe haché), l’appartenance aux groupes, les cotisations, dépenses, propositions et votes. Les pièces jointes et messages de contact sont enregistrés lorsque vous les envoyez. Une inscription à la newsletter enregistre votre adresse email et la date de consentement. Le lien de désinscription dans l’email permet de désactiver l’inscription ; vous pouvez aussi utiliser le formulaire de contact. Les messages de contact sont conservés au maximum un an ; vous pouvez demander leur suppression plus tôt.</p>
      <h2 className="text-xl font-bold">Accès et services facultatifs</h2><p>Les données de groupe sont accessibles aux membres autorisés et aux administrateurs du service. Les jetons de session permettent la connexion. Le cache de l’application conserve certaines données sur votre appareil. Lorsque les notifications sont activées et configurées, un jeton d’appareil est utilisé pour les envoyer. Les fonctions d’analyse, lorsqu’elles sont disponibles et demandées, peuvent transmettre des données du groupe au fournisseur d’analyse.</p>
      <h2 className="text-xl font-bold">Votre appareil et vos demandes</h2><p>La biométrie, lorsqu’elle est activée, utilise les capacités du système de votre appareil. Badenya ne reçoit pas vos empreintes ni votre visage. Vous pouvez modifier vos préférences dans l’application et demander l’accès, la correction ou la suppression de vos données via le formulaire de contact. Les écritures partagées du groupe peuvent nécessiter une conservation pour maintenir un historique cohérent.</p>
      <h2 className="text-xl font-bold">Contact</h2><p>Pour une question sur vos données, utilisez le <Link className="text-blue-700 underline" to="/contact">formulaire de contact</Link>. N’envoyez pas votre mot de passe ni de documents sensibles dans ce formulaire.</p>
    </> : <>
      <h2 className="text-xl font-bold">Utilisation du service</h2><p>Badenya permet de consigner et consulter les opérations et décisions de groupes. Chaque participant doit fournir des informations exactes, protéger son compte et respecter les règles du groupe. Les administrateurs et trésoriers doivent vérifier les justificatifs avant de valider une opération.</p>
      <h2 className="text-xl font-bold">Cotisations et décisions</h2><p>Une opération enregistrée dans Badenya décrit une opération déclarée par les participants. Elle ne constitue pas une preuve de transfert bancaire ni une garantie de paiement. Les membres réalisent leurs transferts séparément. Le groupe reste responsable de ses accords, de ses bénéficiaires et de la vérification des fonds.</p>
      <h2 className="text-xl font-bold">Disponibilité et assistance</h2><p>Les fonctions facultatives dépendent de leur configuration et du réseau. En cas d’erreur de synchronisation, consultez l’état de vos actions avant de les répéter. Contactez l’équipe depuis le <Link className="text-blue-700 underline" to="/contact">formulaire de contact</Link> pour signaler un problème.</p>
      <h2 className="text-xl font-bold">Confidentialité</h2><p>Le traitement des données est décrit dans la <Link className="text-blue-700 underline" to="/privacy">politique de confidentialité</Link>.</p>
    </>}
  </main><Footer /></>;
}
