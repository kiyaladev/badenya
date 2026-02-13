import { Link } from 'react-router-dom';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-3">
                <span className="text-white font-bold text-xl">B</span>
              </div>
              <span className="text-2xl font-bold text-white">Badenya</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              La solution moderne pour gérer vos épargnes collectives en Afrique. Simplifiez la gestion de vos tontines.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="w-10 h-10 bg-gray-800 hover:bg-blue-600 rounded-xl flex items-center justify-center transition-colors duration-300">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 hover:bg-blue-400 rounded-xl flex items-center justify-center transition-colors duration-300">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                </svg>
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 hover:bg-blue-500 rounded-xl flex items-center justify-center transition-colors duration-300">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-bold text-white mb-6 text-lg">Produit</h4>
            <ul className="space-y-4 text-gray-400">
              <li>
                <a href="#features" className="hover:text-white transition-colors duration-300 flex items-center group">
                  <span className="group-hover:translate-x-1 transition-transform duration-300">Fonctionnalités</span>
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-white transition-colors duration-300 flex items-center group">
                  <span className="group-hover:translate-x-1 transition-transform duration-300">Comment ça marche</span>
                </a>
              </li>
              <li>
                <a href="#testimonials" className="hover:text-white transition-colors duration-300 flex items-center group">
                  <span className="group-hover:translate-x-1 transition-transform duration-300">Témoignages</span>
                </a>
              </li>
              <li>
                <a href="#download" className="hover:text-white transition-colors duration-300 flex items-center group">
                  <span className="group-hover:translate-x-1 transition-transform duration-300">Télécharger</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-bold text-white mb-6 text-lg">Entreprise</h4>
            <ul className="space-y-4 text-gray-400">
              <li>
                <Link to="/about" className="hover:text-white transition-colors duration-300 flex items-center group">
                  <span className="group-hover:translate-x-1 transition-transform duration-300">À propos</span>
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition-colors duration-300 flex items-center group">
                  <span className="group-hover:translate-x-1 transition-transform duration-300">Contact</span>
                </Link>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors duration-300 flex items-center group">
                  <span className="group-hover:translate-x-1 transition-transform duration-300">Carrières</span>
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors duration-300 flex items-center group">
                  <span className="group-hover:translate-x-1 transition-transform duration-300">Blog</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-bold text-white mb-6 text-lg">Légal</h4>
            <ul className="space-y-4 text-gray-400">
              <li>
                <a href="#" className="hover:text-white transition-colors duration-300 flex items-center group">
                  <span className="group-hover:translate-x-1 transition-transform duration-300">Conditions d'utilisation</span>
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors duration-300 flex items-center group">
                  <span className="group-hover:translate-x-1 transition-transform duration-300">Politique de confidentialité</span>
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors duration-300 flex items-center group">
                  <span className="group-hover:translate-x-1 transition-transform duration-300">Mentions légales</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            &copy; {currentYear} Badenya. Tous droits réservés.
          </p>
          <p className="text-gray-400 text-sm mt-4 md:mt-0">
            Fait avec ❤️ en Afrique
          </p>
        </div>
      </div>
    </footer>
  );
}
