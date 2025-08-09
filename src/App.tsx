import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { NewRound } from './pages/NewRound';
import { Stats } from './pages/Stats';
import { useAuth } from './hooks/useAuth';
import { AuthModal } from './components/AuthModal';
import { LogOut } from 'lucide-react';

function Navigation() {
  const location = useLocation();
  const { user, signOut, signIn, signUp } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleAuth = async (email: string, password: string, isSignUp: boolean) => {
    try {
      if (isSignUp) {
        const { error } = await signUp(email, password);
        if (error) {
          return { error };
        }
        // After signup, sign in automatically
        const { error: signInError } = await signIn(email, password);
        return { error: signInError };
      } else {
        const { error } = await signIn(email, password);
        return { error };
      }
    } catch (error) {
      return { error };
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setIsMobileMenuOpen(false); // Close mobile menu after sign out
  };

  const openAuthModal = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setShowAuthModal(true);
    setIsMobileMenuOpen(false); // Close mobile menu when opening auth modal
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <nav className="bg-masters-green shadow-lg relative">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="text-xl md:text-2xl font-bold text-white" onClick={closeMobileMenu}>
                MoliStats
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              <Link
                to="/"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === '/'
                    ? 'bg-masters-light-green text-white'
                    : 'text-white hover:bg-masters-light-green'
                }`}
              >
                Nueva Ronda
              </Link>
              <Link
                to="/stats"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === '/stats'
                    ? 'bg-masters-light-green text-white'
                    : 'text-white hover:bg-masters-light-green'
                }`}
              >
                Estadísticas
              </Link>

              {user ? (
                <div className="flex items-center space-x-2">
                  <span className="text-white text-sm hidden lg:block">{user.email}</span>
                  <button
                    onClick={handleSignOut}
                    className="text-white hover:text-masters-yellow transition-colors p-2 rounded"
                    title="Cerrar sesión"
                  >
                    <LogOut size={20} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => openAuthModal('login')}
                    className="text-white hover:text-masters-yellow transition-colors px-3 py-1 rounded text-sm"
                    title="Iniciar sesión"
                  >
                    Iniciar Sesión
                  </button>
                  <button
                    onClick={() => openAuthModal('signup')}
                    className="bg-masters-yellow text-masters-dark-green hover:bg-masters-gold transition-colors px-3 py-1 rounded text-sm font-medium"
                    title="Registrarse"
                  >
                    Registrarse
                  </button>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-white hover:text-masters-yellow transition-colors p-2 rounded"
                aria-label="Toggle mobile menu"
              >
                <svg
                  className={`w-6 h-6 transition-transform duration-200 ${isMobileMenuOpen ? 'rotate-90' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {isMobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          <div className={`md:hidden transition-all duration-300 ease-in-out overflow-hidden ${
            isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}>
            <div className="pb-4 space-y-2 border-t border-masters-light-green/30">
              {/* Navigation Links */}
              <Link
                to="/"
                className={`block px-3 py-3 rounded-md text-base font-medium transition-colors ${
                  location.pathname === '/'
                    ? 'bg-masters-light-green text-white'
                    : 'text-white hover:bg-masters-light-green'
                }`}
                onClick={closeMobileMenu}
              >
                Nueva Ronda
              </Link>
              <Link
                to="/stats"
                className={`block px-3 py-3 rounded-md text-base font-medium transition-colors ${
                  location.pathname === '/stats'
                    ? 'bg-masters-light-green text-white'
                    : 'text-white hover:bg-masters-light-green'
                }`}
                onClick={closeMobileMenu}
              >
                Estadísticas
              </Link>

              {/* User Section */}
              {user ? (
                <div className="pt-2 border-t border-masters-light-green/30">
                  <div className="px-3 py-2">
                    <span className="text-white text-sm font-medium">{user.email}</span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-3 py-3 text-white hover:bg-masters-light-green transition-colors rounded-md flex items-center space-x-2"
                  >
                    <LogOut size={18} />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              ) : (
                <div className="pt-2 border-t border-masters-light-green/30 space-y-2">
                  <button
                    onClick={() => openAuthModal('login')}
                    className="w-full text-left px-3 py-3 text-white hover:bg-masters-light-green transition-colors rounded-md"
                  >
                    Iniciar Sesión
                  </button>
                  <button
                    onClick={() => openAuthModal('signup')}
                    className="w-full text-left px-3 py-3 bg-masters-yellow text-masters-dark-green hover:bg-masters-gold transition-colors rounded-md font-medium"
                  >
                    Registrarse
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuth={handleAuth}
        title={authMode === 'login' ? 'Iniciar Sesión' : 'Registrarse'}
        isSignUp={authMode === 'signup'}
        onToggleMode={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
      />
    </>
  );
}

function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-masters-cream flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-masters-green mx-auto mb-4"></div>
          <p className="text-masters-dark-green">Cargando MoliStats...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-masters-cream">
        <Navigation />
        <main>
          <Routes>
            <Route path="/" element={<NewRound />} />
            <Route path="/stats" element={<Stats />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App; 