import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="bg-gradient-to-br from-blue-50 to-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">À propos de Badenya</h1>
            <p className="text-xl text-gray-600">L'épargne collective, simple et transparente</p>
          </div>

          <section className="bg-white rounded-xl shadow-lg p-8 mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Notre mission</h2>
            <p className="text-lg text-gray-700 leading-relaxed mb-4">
              Badenya modernise les pratiques d'épargne collective en les rendant accessibles, transparentes et faciles à suivre.
            </p>
            <p className="text-lg text-gray-700 leading-relaxed">
              Cotisations, propositions et décisions du groupe sont réunies dans un espace commun : les membres suivent les opérations, les responsables valident les écritures.
            </p>
          </section>

          <div className="text-center">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://badenya.naimba.com"
                className="bg-blue-700 hover:bg-blue-800 text-white px-8 py-4 rounded-lg text-lg font-semibold transition"
              >
                Ouvrir l’application
              </a>
              <Link
                to="/contact"
                className="bg-white hover:bg-gray-50 text-blue-700 px-8 py-4 rounded-lg text-lg font-semibold transition border-2 border-blue-600"
              >
                Nous contacter
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
