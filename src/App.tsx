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
  };

  const openAuthModal = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  return (
    <>
      <nav className="bg-masters-green shadow-lg">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="text-2xl font-bold text-white">
                MoliStats
              </Link>
            </div>

            <div className="flex items-center space-x-4">
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
                  <span className="text-white text-sm">{user.email}</span>
                  <button
                    onClick={handleSignOut}
                    className="text-white hover:text-masters-yellow transition-colors"
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