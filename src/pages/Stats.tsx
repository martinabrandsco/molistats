import React from 'react';
import { StatsDashboard } from '../components/StatsDashboard';
import { useAuth } from '../hooks/useAuth';
import { LogIn } from 'lucide-react';

export function Stats() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-masters-cream flex items-center justify-center p-4">
        <div className="card text-center max-w-md">
          <LogIn className="w-16 h-16 text-masters-green mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-masters-green mb-2">Inicia Sesión</h2>
          <p className="text-masters-dark-green mb-4">
            Necesitas iniciar sesión para ver tus estadísticas.
          </p>
          <button className="btn-primary">
            Iniciar Sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-masters-cream p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-masters-green mb-2">MoliStats</h1>
          <p className="text-masters-dark-green">Dashboard de Estadísticas</p>
        </div>

        {/* Stats Dashboard */}
        <StatsDashboard userId={user.id} />
      </div>
    </div>
  );
} 