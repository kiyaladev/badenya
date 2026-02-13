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
                  icon: '🤝',
                  title: 'Confiance',
                  description: 'Nous construisons une plateforme basée sur la transparence et la sécurité pour instaurer la confiance entre tous les membres.',
                },
                {
                  icon: '🚀',
                  title: 'Innovation',
                  description: 'Nous combinons les meilleures pratiques traditionnelles avec les technologies modernes pour créer des solutions adaptées.',
                },
                {
                  icon: '🌍',
                  title: 'Impact',
                  description: 'Nous nous engageons à avoir un impact positif sur les communautés africaines en facilitant l\'accès à l\'épargne et à l\'investissement.',
                },
              ].map((value) => (
                <div key={value.title} className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-xl">
                  <div className="text-4xl mb-4">{value.icon}</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{value.title}</h3>
                  <p className="text-gray-600">{value.description}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Story */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl p-8 text-white mb-12"
          >
            <h2 className="text-3xl font-bold mb-6">Notre Histoire</h2>
            <div className="space-y-4 text-lg leading-relaxed opacity-90">
              <p>
                Badenya a été fondé en 2024 par une équipe passionnée d'entrepreneurs et de développeurs africains qui ont grandi en participant à des tontines familiales et communautaires.
              </p>
              <p>
                Nous avons constaté que bien que ces pratiques d'épargne collective soient extrêmement populaires et efficaces, elles souffraient souvent d'un manque de transparence, de difficultés de gestion et de limitations géographiques.
              </p>
              <p>
                C'est ainsi qu'est né Badenya - du mot bambara signifiant "entraide" - une plateforme qui digitalise et améliore ces pratiques ancestrales tout en préservant leur essence communautaire.
              </p>
            </div>
          </motion.div>

          {/* Team */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Notre Équipe</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  name: 'Amadou Diop',
                  role: 'CEO & Co-fondateur',
                  bio: '10 ans d\'expérience en fintech et entrepreneuriat social.',
                },
                {
                  name: 'Mariam Kante',
                  role: 'CTO & Co-fondatrice',
                  bio: 'Experte en développement mobile et architecture cloud.',
                },
                {
                  name: 'Youssouf Traore',
                  role: 'Head of Product',
                  bio: 'Passionné par l\'UX/UI et l\'innovation centrée sur l\'utilisateur.',
                },
              ].map((member) => (
                <div key={member.name} className="bg-white rounded-xl shadow-lg p-6 text-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <span className="text-white text-3xl font-bold">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{member.name}</h3>
                  <p className="text-blue-600 font-medium mb-3">{member.role}</p>
                  <p className="text-gray-600 text-sm">{member.bio}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.0 }}
            className="mt-16 bg-white rounded-xl shadow-lg p-8"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Badenya en Chiffres</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {[
                { number: '10K+', label: 'Utilisateurs actifs' },
                { number: '500+', label: 'Groupes créés' },
                { number: '50M+', label: 'XOF épargnés' },
                { number: '4.8/5', label: 'Note moyenne' },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-4xl font-bold text-blue-600 mb-2">{stat.number}</div>
                  <div className="text-gray-600">{stat.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

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
                href="/#download"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition"
              >
                Télécharger l'app
              </a>
              <a
                href="/contact"
                className="bg-white hover:bg-gray-50 text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold transition border-2 border-blue-600"
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
