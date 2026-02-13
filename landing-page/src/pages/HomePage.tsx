import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

// Custom hook for counting animation
function useCountUp(end: number, duration: number = 2000) {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;

    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);
  }, [isVisible, end, duration]);

  return { count, ref };
}

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

// Stat Item component with animated counter
function StatItem({ end, suffix, label, index }: { 
  end: number; 
  suffix: string; 
  label: string;
  index: number;
}) {
  const { count, ref } = useCountUp(end, 2000);
  return (
    <div ref={ref} className="text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
      >
        <p className="text-4xl md:text-5xl font-bold text-white mb-2">
          {count.toLocaleString()}{suffix}
        </p>
        <p className="text-blue-100 text-sm md:text-base">{label}</p>
      </motion.div>
    </div>
  );
}

export default function HomePage() {
  const [email, setEmail] = useState('');
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Merci de vous être inscrit avec l'email: ${email}`);
    setEmail('');
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
                    Télécharger l'app
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
                    <span className="text-2xl font-bold text-gray-900">2,450,000 XOF</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">👥 Groupe Famille</span>
                      <span className="font-medium">850,000 XOF</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">💼 Investissement Pro</span>
                      <span className="font-medium">1,200,000 XOF</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">🎯 Projet Immo</span>
                      <span className="font-medium">400,000 XOF</span>
                    </div>
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
                icon: '👥',
                title: 'Gestion de groupes',
                description: 'Créez et gérez plusieurs groupes d\'épargne avec des rôles et permissions.',
              },
              {
                icon: '💰',
                title: 'Suivi des cotisations',
                description: 'Suivez facilement toutes les contributions et les dépenses de votre groupe.',
              },
              {
                icon: '🗳️',
                title: 'Votes démocratiques',
                description: 'Prenez des décisions importantes ensemble grâce au système de vote intégré.',
              },
              {
                icon: '📊',
                title: 'Rapports détaillés',
                description: 'Générez des rapports financiers complets et exportez-les en PDF ou Excel.',
              },
              {
                icon: '🔔',
                title: 'Notifications en temps réel',
                description: 'Restez informé de toutes les activités importantes de vos groupes.',
              },
              {
                icon: '🔒',
                title: 'Sécurité maximale',
                description: 'Vos données sont protégées avec un chiffrement de niveau bancaire.',
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-3xl">{feature.icon}</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { end: 10000, suffix: '+', label: 'Utilisateurs actifs' },
              { end: 500, suffix: '+', label: 'Groupes créés' },
              { end: 50, suffix: 'M+', label: 'XOF épargnés' },
              { end: 98, suffix: '%', label: 'Satisfaction' },
            ].map((stat, index) => (
              <StatItem key={index} {...stat} index={index} />
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
                step: '01',
                title: 'Téléchargez l\'app',
                description: 'Installez Badenya gratuitement sur votre smartphone Android ou iOS.',
              },
              {
                step: '02',
                title: 'Créez votre groupe',
                description: 'Configurez votre groupe d\'épargne en quelques clics et invitez vos membres.',
              },
              {
                step: '03',
                title: 'Commencez à épargner',
                description: 'Gérez les cotisations, votez sur les dépenses et suivez votre progression.',
              },
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                className="relative"
              >
                <div className="bg-white p-8 rounded-xl shadow-lg">
                  <div className="text-6xl font-bold text-blue-100 mb-4">{step.step}</div>
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

      {/* Testimonials Section */}
      <section id="testimonials" className="py-24 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <span className="text-blue-600 font-semibold text-sm uppercase tracking-wider">Témoignages</span>
            <h2 className="text-4xl font-bold text-gray-900 mt-2 mb-4">
              Ce que disent nos utilisateurs
            </h2>
            <p className="text-xl text-gray-600">
              Rejoignez des milliers d'utilisateurs satisfaits
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'Aminata Diallo',
                role: 'Présidente de groupe, Dakar',
                content: 'Badenya a transformé la gestion de notre tontine familiale. Tout est transparent et facile à suivre !',
                rating: 5,
                avatar: 'AD',
              },
              {
                name: 'Moussa Kone',
                role: 'Entrepreneur, Abidjan',
                content: 'L\'application est intuitive et le système de vote nous aide à prendre de meilleures décisions ensemble.',
                rating: 5,
                avatar: 'MK',
              },
              {
                name: 'Fatou Sow',
                role: 'Trésorière, Bamako',
                content: 'Les rapports automatiques me font gagner un temps précieux. Je recommande vivement !',
                rating: 5,
                avatar: 'FS',
              },
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                  </div>
                </div>
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <svg
                      key={i}
                      className="w-5 h-5 text-yellow-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-700 leading-relaxed italic">"{testimonial.content}"</p>
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
                question: 'Comment créer un groupe d\'épargne ?',
                answer: 'Il suffit de télécharger l\'application, créer votre compte et suivre les étapes de création de groupe. Vous pourrez ensuite inviter vos membres par SMS ou email.',
              },
              {
                question: 'Badenya est-il sécurisé ?',
                answer: 'Oui ! Nous utilisons un chiffrement de niveau bancaire pour protéger toutes vos données. De plus, toutes les actions importantes nécessitent une authentification.',
              },
              {
                question: 'Combien coûte l\'application ?',
                answer: 'Badenya est gratuit pour les groupes de moins de 20 membres. Pour les groupes plus importants, nous proposons des plans premium avec des fonctionnalités avancées.',
              },
              {
                question: 'Comment sont sécurisées mes données ?',
                answer: 'Vos données sont protégées par un chiffrement de bout en bout et stockées sur des serveurs sécurisés. Nous utilisons les meilleures pratiques de sécurité pour garantir la confidentialité de vos informations.',
              },
              {
                question: 'Comment sont gérés les paiements ?',
                answer: 'Badenya s\'intègre avec les principales plateformes de paiement mobile (Wave, Orange Money, MTN Money) pour faciliter les transactions.',
              },
            ].map((faq, index) => (
              <FAQItem
                key={index}
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
              Téléchargez Badenya maintenant et transformez la gestion de vos épargnes collectives
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a
                href="#"
                className="group bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center space-x-3"
              >
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
                <div className="text-left">
                  <div className="text-xs">Télécharger sur</div>
                  <div className="text-lg font-bold">App Store</div>
                </div>
              </a>
              <a
                href="#"
                className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition shadow-lg flex items-center space-x-3"
              >
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 0 1 0 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.802 8.99l-2.303 2.303-8.635-8.635z" />
                </svg>
                <div className="text-left">
                  <div className="text-xs">Télécharger sur</div>
                  <div className="text-lg font-bold">Google Play</div>
                </div>
              </a>
            </div>

            {/* Newsletter */}
            <div className="mt-12 pt-12 border-t border-white/20">
              <h3 className="text-2xl font-bold mb-4">Restez informé</h3>
              <p className="mb-6 opacity-90">
                Inscrivez-vous à notre newsletter pour recevoir les dernières actualités
              </p>
              <form onSubmit={handleNewsletterSubmit} className="max-w-md mx-auto flex gap-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Votre email"
                  required
                  className="flex-1 px-4 py-3 rounded-lg text-gray-900 focus:ring-2 focus:ring-white focus:outline-none"
                />
                <button
                  type="submit"
                  className="bg-gray-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition"
                >
                  S'inscrire
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
