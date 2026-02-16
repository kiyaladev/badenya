import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import HomePage from './pages/HomePage';
import ContactPage from './pages/ContactPage';
import AboutPage from './pages/AboutPage';

function App() {
  return (
    <MotionConfig reducedMotion="user">
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </MotionConfig>
  );
}

export default App;
