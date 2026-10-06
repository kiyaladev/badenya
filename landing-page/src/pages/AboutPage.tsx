import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function AboutPage() {
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="bg-gradient-to-br from-blue-50 to-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeInUp} className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              À propos de Badenya
            </h1>
            <p className="text-xl text-gray-600">
              Révolutionner l'épargne collective en Afrique
            </p>
          </motion.div>

          {/* Mission */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white rounded-xl shadow-lg p-8 mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Notre Mission</h2>
            <p className="text-lg text-gray-700 leading-relaxed mb-4">
              Badenya est né d'une vision simple mais puissante : moderniser les pratiques d'épargne collective traditionnelles africaines en les rendant accessibles, transparentes et efficaces grâce à la technologie.
            </p>
            <p className="text-lg text-gray-700 leading-relaxed">
              Nous croyons fermement au pouvoir de la communauté et de l'entraide. Notre mission est de fournir aux groupes d'épargne, aux tontines et aux associations d'investissement les outils digitaux dont ils ont besoin pour prospérer au 21ème siècle.
            </p>
          </motion.div>

          {/* Values */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Nos Valeurs</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  id: 'value-trust',
                  icon: '🤝',
                  title: 'Confiance',
                  description: 'Nous construisons une plateforme basée sur la transparence et la sécurité pour instaurer la confiance entre tous les membres.',
                },
                {
                  id: 'value-innovation',
                  icon: '🚀',
                  title: 'Innovation',
                  description: 'Nous combinons les meilleures pratiques traditionnelles avec les technologies modernes pour créer des solutions adaptées.',
                },
                {
                  id: 'value-impact',
                  icon: '🌍',
                  title: 'Impact',
                  description: 'Nous nous engageons à avoir un impact positif sur les communautés africaines en facilitant l\'accès à l\'épargne et à l\'investissement.',
                },
              ].map((value) => (
                <div key={value.id} className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-xl">
                  <div className="text-4xl mb-4">{value.icon}</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{value.title}</h3>
                  <p className="text-gray-600">{value.description}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <section className="bg-blue-50 rounded-xl p-8 text-gray-800">
            <h2 className="text-3xl font-bold mb-6">Un historique partagé</h2>
            <p>Badenya rassemble les cotisations, propositions et décisions d’un groupe dans un espace commun. Les membres peuvent suivre les opérations ; les responsables valident les écritures et les bénéficiaires.</p>
          </section>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.2 }}
            className="mt-16 text-center"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Rejoignez l'aventure Badenya
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Faites partie de la révolution de l'épargne collective en Afrique
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://badenya.naimba.com"
                className="bg-blue-700 hover:bg-blue-800 text-white px-8 py-4 rounded-lg text-lg font-semibold transition"
              >
                Ouvrir l’application
              </a>
              <a
                href="/contact"
                className="bg-white hover:bg-gray-50 text-blue-700 px-8 py-4 rounded-lg text-lg font-semibold transition border-2 border-blue-600"
              >
                Nous contacter
              </a>
            </div>
          </motion.div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
