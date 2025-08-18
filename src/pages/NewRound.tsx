import { useState } from 'react';
import { HoleForm } from '../components/HoleForm';
import { HoleStats } from '../types';
import { calculateRoundStats } from '../utils/statsCalculator';
import { statsService, authService } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { AuthModal } from '../components/AuthModal';
import { CheckCircle, Save } from 'lucide-react';

export function NewRound() {
  const { user } = useAuth();
  const [courseName, setCourseName] = useState('');
  const [totalHoles, setTotalHoles] = useState<9 | 18>(18);
  const [currentHole, setCurrentHole] = useState(0);
  const [roundStarted, setRoundStarted] = useState(false);
  const [holeStats, setHoleStats] = useState<HoleStats[]>([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleHoleComplete = (stats: HoleStats) => {
    console.log('Hole complete:', stats);
    const updatedStats = [...holeStats];
    const existingIndex = updatedStats.findIndex(s => s.holeNumber === stats.holeNumber);
    
    if (existingIndex >= 0) {
      updatedStats[existingIndex] = stats;
      console.log('Updated existing hole stats');
    } else {
      updatedStats.push(stats);
      console.log('Added new hole stats');
    }
    
    console.log('All hole stats:', updatedStats);
    setHoleStats(updatedStats);
    
    if (currentHole < totalHoles) {
      setCurrentHole(currentHole + 1);
    } else {
      // Round complete
      handleRoundComplete(updatedStats);
    }
  };

  const handlePreviousHole = () => {
    if (currentHole > 1) {
      setCurrentHole(currentHole - 1);
    }
  };

  const handleRoundComplete = async (stats: HoleStats[]) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    console.log('Current user (complete):', user);
    console.log('User ID (complete):', user.id);
    console.log('User ID type (complete):', typeof user.id);

    setIsSaving(true);
    
    try {
      const roundStats = calculateRoundStats(stats, courseName);
      console.log('Round stats to save (complete):', roundStats);
      
      const { error } = await statsService.saveRoundStats({
        ...roundStats,
        userId: user.id
      });
      
      if (error) {
        console.error('Error saving round:', error);
        alert(`Error al guardar la ronda: ${error.message || 'Error desconocido'}`);
      } else {
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          // Reset form
          setCourseName('');
          setTotalHoles(18);
          setCurrentHole(0);
          setRoundStarted(false);
          setHoleStats([]);
        }, 3000);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar la ronda. Inténtalo de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveRound = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    console.log('Current user:', user);
    console.log('User ID:', user.id);
    console.log('User ID type:', typeof user.id);

    if (holeStats.length === 0) {
      alert('No hay estadísticas para guardar. Completa al menos un hoyo.');
      return;
    }

    setIsSaving(true);
    
    try {
      const roundStats = calculateRoundStats(holeStats, courseName);
      console.log('Round stats to save:', roundStats);
      
      const { error } = await statsService.saveRoundStats({
        ...roundStats,
        userId: user.id
      });
      
      if (error) {
        console.error('Error saving round:', error);
        alert(`Error al guardar la ronda: ${error.message || 'Error desconocido'}`);
      } else {
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          // Reset form
          setCourseName('');
          setTotalHoles(18);
          setCurrentHole(0);
          setRoundStarted(false);
          setHoleStats([]);
        }, 3000);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar la ronda. Inténtalo de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };



  const handleAuth = async (email: string, password: string, isSignUp: boolean) => {
    try {
      if (isSignUp) {
        const { error } = await authService.signUp(email, password);
        if (error) {
          return { error };
        }
        // After signup, sign in automatically
        const { error: signInError } = await authService.signIn(email, password);
        return { error: signInError };
      } else {
        const { error } = await authService.signIn(email, password);
        return { error };
      }
    } catch (error) {
      return { error };
    }
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-masters-cream flex items-center justify-center p-4">
        <div className="card text-center max-w-md">
          <CheckCircle className="w-16 h-16 text-masters-green mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-masters-green mb-2">¡Ronda Guardada!</h2>
          <p className="text-masters-dark-green">Tus estadísticas han sido guardadas exitosamente.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-masters-cream p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-masters-green mb-2">Nueva Ronda de Golf</h1>
        </div>

        {/* Course Name Input */}
        {!roundStarted && (
          <div className="card max-w-md mx-auto mb-8">
            <h2 className="text-xl font-semibold text-masters-dark-green mb-4">Configuración de la Ronda</h2>
            
            {/* Course Name */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-masters-dark-green mb-2">
                Nombre del Campo
              </label>
              <input
                type="text"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                placeholder="Introduce el nombre del campo"
                className="input-field"
                required
              />
            </div>

            {/* Number of Holes */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-masters-dark-green mb-2">
                Número de Hoyos
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="totalHoles"
                    value="9"
                    checked={totalHoles === 9}
                    onChange={() => setTotalHoles(9)}
                    className="mr-2 text-masters-green focus:ring-masters-green"
                  />
                  <span className="text-masters-dark-green">9 hoyos</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="totalHoles"
                    value="18"
                    checked={totalHoles === 18}
                    onChange={() => setTotalHoles(18)}
                    className="mr-2 text-masters-green focus:ring-masters-green"
                  />
                  <span className="text-masters-dark-green">18 hoyos</span>
                </label>
              </div>
            </div>

            {courseName && (
              <button
                onClick={() => {
                  setCurrentHole(1);
                  setRoundStarted(true);
                }}
                className="btn-primary w-full"
              >
                Comenzar Ronda de {totalHoles} Hoyos
              </button>
            )}
          </div>
        )}

        {/* Progress Bar */}
        {roundStarted && currentHole >= 1 && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-masters-dark-green">
                Progreso: {currentHole}/{totalHoles} hoyos
              </span>
              <span className="text-sm text-masters-green font-medium">
                {Math.round((currentHole / totalHoles) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-masters-green h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentHole / totalHoles) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

                        {/* Hole Form */}
                {roundStarted && currentHole >= 1 && currentHole <= totalHoles && (
                  <HoleForm
                    holeNumber={currentHole}
                    onNext={handleHoleComplete}
                    onPrevious={currentHole > 1 ? handlePreviousHole : undefined}
                    isLastHole={currentHole === totalHoles}
                    initialStats={holeStats.find(s => s.holeNumber === currentHole)}
                  />
                )}

        {/* Save Round Button */}
        {roundStarted && holeStats.length > 0 && (
          <div className="mt-6 text-center">
            <button
              onClick={handleSaveRound}
              disabled={isSaving}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4 inline mr-2" />
              Guardar Ronda ({holeStats.length} hoyos completados)
            </button>
          </div>
        )}

        {/* Save Button */}
        {isSaving && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 text-center">
              <Save className="w-8 h-8 text-masters-green mx-auto mb-2 animate-spin" />
              <p className="text-masters-dark-green">Guardando ronda...</p>
            </div>
          </div>
        )}

        {/* Auth Modal */}
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onAuth={handleAuth}
          title="Inicia sesión para guardar tu ronda"
          isSignUp={false}
        />
      </div>
    </div>
  );
} 