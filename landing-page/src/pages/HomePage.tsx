import { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const APP_URL = 'https://badenya.naimba.com';

function FAQItem({ question, answer, isOpen, onClick }: {
  question: string;
  answer: string;
  isOpen: boolean;
  onClick: () => void;
}) {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <button
        aria-expanded={isOpen}
        onClick={onClick}
        className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50"
      >
        <h3 className="text-lg font-semibold text-gray-900 pr-4">{question}</h3>
        <svg
          className={`w-5 h-5 text-blue-600 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && <p className="px-6 pb-6 text-gray-600">{answer}</p>}
    </div>
  );
}

export default function HomePage() {
  const [email, setEmail] = useState('');
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [newsletterSubmitted, setNewsletterSubmitted] = useState(false);
  const [newsletterSubmitting, setNewsletterSubmitting] = useState(false);
  const [newsletterError, setNewsletterError] = useState<string | null>(null);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewsletterSubmitting(true);
    setNewsletterError(null);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://badenya-api.naimba.com/api/v1';
      const response = await fetch(`${apiUrl}/contact/newsletter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error('Failed to subscribe');
      }

      setNewsletterSubmitted(true);
      setEmail('');
    } catch (error) {
      console.error('Newsletter subscription failed:', error);
      setNewsletterError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setNewsletterSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-purple-50 py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div>
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Gérez vos{' '}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                  épargnes collectives
                </span>{' '}
                en toute simplicité
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Badenya vous aide à créer et gérer vos tontines et groupes d'épargne, directement depuis votre navigateur.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href={APP_URL}
                  className="group bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-4 rounded-xl text-lg font-semibold text-center transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  <span className="flex items-center justify-center gap-2">
                    Ouvrir l’application
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                </a>
                <a
                  href="#how-it-works"
                  className="group bg-white hover:bg-gray-50 text-blue-600 px-8 py-4 rounded-xl text-lg font-semibold text-center transition-all duration-300 border-2 border-blue-600 hover:border-blue-700 hover:shadow-lg"
                >
                  En savoir plus
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-blue-600 font-semibold text-sm uppercase tracking-wider">Fonctionnalités</span>
            <h2 className="text-4xl font-bold text-gray-900 mt-2 mb-4">
              Fonctionnalités puissantes
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Tout ce dont vous avez besoin pour gérer vos groupes d'épargne de manière efficace
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                id: 'feature-groups',
                icon: (
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                ),
                title: 'Gestion de groupes',
                description: 'Créez vos groupes d\'épargne et attribuez les rôles : membre, trésorier, administrateur.',
              },
              {
                id: 'feature-contributions',
                icon: (
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                title: 'Suivi des cotisations',
                description: 'Suivez facilement toutes les contributions et les dépenses de votre groupe.',
              },
              {
                id: 'feature-votes',
                icon: (
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                title: 'Votes démocratiques',
                description: 'Prenez des décisions importantes ensemble grâce au système de vote intégré.',
              },
            ].map((feature) => (
              <div
                key={feature.id}
                className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-purple-50 rounded-full flex items-center justify-center mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works Section */}
      <section id="how-it-works" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-blue-600 font-semibold text-sm uppercase tracking-wider">Guide</span>
            <h2 className="text-4xl font-bold text-gray-900 mt-2 mb-4">
              Comment ça marche ?
            </h2>
            <p className="text-xl text-gray-600">
              Commencez en 2 étapes simples
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                id: 'step-create',
                step: '01',
                title: 'Créez votre groupe',
                description: 'Configurez votre groupe d\'épargne en quelques clics et invitez vos membres.',
              },
              {
                id: 'step-save',
                step: '02',
                title: 'Commencez à épargner',
                description: 'Gérez les cotisations, votez sur les dépenses et suivez votre progression.',
              },
            ].map((step, index) => (
              <div key={step.id} className="relative"
              >
                <div className="bg-white p-8 rounded-xl shadow-lg">
                  <div className="text-6xl font-bold text-blue-700 mb-4">{step.step}</div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-3">{step.title}</h3>
                  <p className="text-gray-600">{step.description}</p>
                </div>
                {index < 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <svg
                      className="w-8 h-8 text-blue-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-blue-600 font-semibold text-sm uppercase tracking-wider">FAQ</span>
            <h2 className="text-4xl font-bold text-gray-900 mt-2 mb-4">
              Questions fréquentes
            </h2>
            <p className="text-xl text-gray-600">
              Tout ce que vous devez savoir sur Badenya
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                id: 'faq-create-group',
                question: 'Comment créer un groupe d\'épargne ?',
                answer: 'Ouvrez Badenya dans votre navigateur, créez votre compte puis suivez les étapes de création de groupe. Vous pourrez ensuite inviter vos membres.',
              },
              {
                id: 'faq-security',
                question: 'Mes données sont-elles protégées ?',
                answer: 'Les échanges avec Badenya passent par HTTPS et l’accès à votre compte et à vos groupes est contrôlé selon votre rôle. Consultez notre politique de confidentialité pour connaître les données traitées.',
              },
              {
                id: 'faq-pricing',
                question: 'Combien coûte Badenya ?',
                answer: 'Badenya est gratuit.',
              },
              {
                id: 'faq-payments',
                question: 'Comment sont gérés les paiements ?',
                answer: 'Badenya enregistre les cotisations et dépenses déclarées par les membres et validées par les responsables du groupe. Les transferts d’argent sont réalisés séparément par les participants.',
              },
            ].map((faq, index) => (
              <FAQItem
                key={faq.id}
                question={faq.question}
                answer={faq.answer}
                isOpen={openFAQ === index}
                onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Download Section */}
      <section id="download" className="py-24 bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Prêt à commencer ?
            </h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Accédez à Badenya depuis votre navigateur pour gérer vos groupes
            </p>
            <a href={APP_URL} className="inline-flex rounded-xl bg-white px-8 py-4 font-bold text-blue-800 hover:bg-blue-50">Ouvrir l’application web</a>

            {/* Newsletter */}
            <div className="mt-12 rounded-xl bg-white/10 p-8">
              <h3 className="text-2xl font-bold mb-4">Restez informé</h3>
              <p className="mb-6 opacity-90">
                Inscrivez-vous à notre newsletter pour recevoir les dernières actualités
              </p>
              <form onSubmit={handleNewsletterSubmit} className="max-w-md mx-auto flex flex-col sm:flex-row gap-4">
                {newsletterSubmitted ? (
                  <p className="text-white text-lg font-medium py-3">
                    Votre inscription a été enregistrée.
                  </p>
                ) : (
                  <>
                    <div className="flex-1">
                      <label htmlFor="newsletter-email" className="block text-sm text-white/80 mb-1 text-left">
                        Adresse email
                      </label>
                      <input
                        id="newsletter-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Votre email"
                        required
                        pattern="^[^\s@]+@[^\s@]+\.[^\s@]+$"
                        className="w-full px-4 py-3 rounded-lg text-gray-900 focus:ring-2 focus:ring-white focus:outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={newsletterSubmitting}
                      className="bg-gray-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition self-end disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {newsletterSubmitting ? '…' : 'S\'inscrire'}
                    </button>
                  </>
                )}
                {newsletterError && (
                  <p className="text-white/80 text-sm mt-2" role="alert">{newsletterError}</p>
                )}
              </form>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
