import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

// FAQ Item component
function FAQItem({ question, answer, isOpen, onClick }: { 
  question: string; 
  answer: string; 
  isOpen: boolean; 
  onClick: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-xl shadow-md overflow-hidden"
    >
      <button
        aria-expanded={isOpen}
        onClick={onClick}
        className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors duration-200"
      >
        <h3 className="text-lg font-semibold text-gray-900 pr-4">{question}</h3>
        <motion.svg
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="w-5 h-5 text-blue-600 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </motion.svg>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <p className="px-6 pb-6 text-gray-600">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Demo balance showcase — illustrative data for hero section
const DEMO_GROUPS = [
  { emoji: '👥', name: 'Groupe Famille', amount: '850,000 XOF', progress: 85, gradient: 'from-blue-500 to-blue-600' },
  { emoji: '💼', name: 'Investissement Pro', amount: '1,200,000 XOF', progress: 60, gradient: 'from-purple-500 to-purple-600' },
  { emoji: '🎯', name: 'Projet Immo', amount: '400,000 XOF', progress: 40, gradient: 'from-green-500 to-green-600' },
];
const DEMO_TOTAL = '2,450,000 XOF';

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

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-purple-50 py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div {...fadeInUp}>
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Gérez vos{' '}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                  épargnes collectives
                </span>{' '}
                en toute simplicité
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Badenya vous aide à créer, gérer et faire fructifier vos tontines et groupes d'épargne avec la puissance du digital.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="#download"
                  className="group bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-4 rounded-xl text-lg font-semibold text-center transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                  <span className="flex items-center justify-center gap-2">
                    Ouvrir l’application
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-8 shadow-2xl">
                <div className="bg-white rounded-xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Solde total</span>
                    <span className="text-2xl font-bold text-gray-900 animate-pulse">{DEMO_TOTAL}</span>
                  </div>
                  <div className="space-y-3">
                    {DEMO_GROUPS.map((group) => (
                      <div key={group.name}>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">{group.emoji} {group.name}</span>
                          <span className="font-medium">{group.amount}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                          <div className={`bg-gradient-to-r ${group.gradient} h-1.5 rounded-full`} style={{ width: `${group.progress}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <span className="text-blue-600 font-semibold text-sm uppercase tracking-wider">Fonctionnalités</span>
            <h2 className="text-4xl font-bold text-gray-900 mt-2 mb-4">
              Fonctionnalités puissantes
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Tout ce dont vous avez besoin pour gérer vos groupes d'épargne de manière efficace
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                id: 'feature-groups',
                icon: (
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                ),
                title: 'Gestion de groupes',
                description: 'Créez et gérez plusieurs groupes d\'épargne avec des rôles et permissions.',
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
              {
                id: 'feature-reports',
                icon: (
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                ),
                title: 'Rapports détaillés',
                description: 'Générez des rapports financiers complets et exportez-les en PDF ou Excel.',
              },
              {
                id: 'feature-notifications',
                icon: (
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                ),
                title: 'Notifications en temps réel',
                description: 'Restez informé de toutes les activités importantes de vos groupes.',
              },
              {
                id: 'feature-security',
                icon: (
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                ),
                title: 'Accès par rôle',
                description: 'Les membres, trésoriers et administrateurs disposent d’autorisations adaptées à leurs responsabilités.',
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-purple-50 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works Section */}
      <section id="how-it-works" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <span className="text-blue-600 font-semibold text-sm uppercase tracking-wider">Guide</span>
            <h2 className="text-4xl font-bold text-gray-900 mt-2 mb-4">
              Comment ça marche ?
            </h2>
            <p className="text-xl text-gray-600">
              Commencez en 3 étapes simples
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                id: 'step-download',
                step: '01',
                title: 'Ouvrez l’application',
                description: 'Ouvrez Badenya depuis votre navigateur.',
              },
              {
                id: 'step-create',
                step: '02',
                title: 'Créez votre groupe',
                description: 'Configurez votre groupe d\'épargne en quelques clics et invitez vos membres.',
              },
              {
                id: 'step-save',
                step: '03',
                title: 'Commencez à épargner',
                description: 'Gérez les cotisations, votez sur les dépenses et suivez votre progression.',
              },
            ].map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                className="relative"
              >
                <div className="bg-white p-8 rounded-xl shadow-lg">
                  <div className="text-6xl font-bold text-blue-700 mb-4">{step.step}</div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-3">{step.title}</h3>
                  <p className="text-gray-600">{step.description}</p>
                </div>
                {index < 2 && (
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
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <span className="text-blue-600 font-semibold text-sm uppercase tracking-wider">FAQ</span>
            <h2 className="text-4xl font-bold text-gray-900 mt-2 mb-4">
              Questions fréquentes
            </h2>
            <p className="text-xl text-gray-600">
              Tout ce que vous devez savoir sur Badenya
            </p>
          </motion.div>

          <div className="space-y-4">
            {[
              {
                id: 'faq-create-group',
                question: 'Comment créer un groupe d\'épargne ?',
                answer: 'Il suffit de télécharger l\'application, créer votre compte et suivre les étapes de création de groupe. Vous pourrez ensuite inviter vos membres par SMS ou email.',
              },
              {
                id: 'faq-security',
                question: 'Badenya est-il sécurisé ?',
                answer: 'Oui ! Nous utilisons un chiffrement de niveau bancaire pour protéger toutes vos données. De plus, toutes les actions importantes nécessitent une authentification.',
              },
              {
                id: 'faq-pricing',
                question: 'Combien coûte l\'application ?',
                answer: 'Les fonctions proposées et les éventuelles conditions tarifaires sont indiquées dans le service. Aucun paiement intégré n’est proposé par cette page.',
              },
              {
                id: 'faq-data-security',
                question: 'Comment sont sécurisées mes données ?',
                answer: 'Vos données sont protégées par un contrôle des accès à votre compte et à vos groupes. Les échanges avec le service en ligne utilisent HTTPS. Consultez notre politique de confidentialité pour connaître les données traitées.',
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
      <section id="download" className="py-24 bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 text-white relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-white/5 rounded-full"></div>
          <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-white/5 rounded-full"></div>
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div {...fadeInUp}>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Prêt à commencer ?
            </h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Accédez à Badenya depuis votre navigateur pour gérer vos groupes
            </p>
            <a href="https://badenya.naimba.com" className="inline-flex rounded-xl bg-white px-8 py-4 font-bold text-blue-800 hover:bg-blue-50">Ouvrir l’application web</a>
            <p className="mt-4 text-white">Les liens de distribution Android et iOS seront affichés lorsqu’une version de distribution sera disponible.</p>

            {/* Newsletter */}
            <div className="mt-12 pt-12 border-t border-white/20">
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
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
