import { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { statsService } from '../services/supabase';
import { FilterOption, RoundStats } from '../types';
import { DISTANCE_INTERVALS } from '../utils/statsCalculator';

interface StatsDashboardProps {
  userId: string;
}

interface AverageStats {
  // Estadísticas generales (todas las rondas)
  averageScore: number;
  averageFir: number;
  averageGir: number;
  averagePutts: number;
  averageScrambling: number | null;
  averageSandSave: number | null;
  averagePenalties: number;
  
  // Estadísticas separadas por número de hoyos
  averageScore9Holes: number | null;
  averageScore18Holes: number | null;
  averageFir9Holes: number | null;
  averageFir18Holes: number | null;
  averageGir9Holes: number | null;
  averageGir18Holes: number | null;
  averagePutts9Holes: number | null;
  averagePutts18Holes: number | null;
}



export function StatsDashboard({ userId }: StatsDashboardProps) {
  const [filter, setFilter] = useState<FilterOption>('Todas');
  const [averageStats, setAverageStats] = useState<AverageStats | null>(null);
  const [roundStats, setRoundStats] = useState<RoundStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingRound, setDeletingRound] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, [userId, filter]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const { data: averages, error: avgError } = await statsService.getAverageStats(userId, filter);
      const { data: rounds, error: roundsError } = await statsService.getRoundStats(userId, filter);
      
      if (avgError) {
        console.error('Error loading average stats:', avgError);
      }
      if (roundsError) {
        console.error('Error loading round stats:', roundsError);
      }
      
      setAverageStats(averages);
      setRoundStats(rounds || []);
    } catch (error) {
      console.error('Error in loadStats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRound = async (roundId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta ronda? Esta acción no se puede deshacer.')) {
      return;
    }

    setDeletingRound(roundId);
    
    try {
      const { error } = await statsService.deleteRoundStats(roundId);
      
      if (error) {
        console.error('Error deleting round:', error);
        alert('Error al eliminar la ronda. Inténtalo de nuevo.');
      } else {
        // Reload stats after deletion
        await loadStats();
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al eliminar la ronda. Inténtalo de nuevo.');
    } finally {
      setDeletingRound(null);
    }
  };

  const girByDistanceData = DISTANCE_INTERVALS.map(interval => {
    const total = roundStats.reduce((sum, round) => 
      sum + (round.girByDistance?.[interval.label]?.total || 0), 0
    );
    const gir = roundStats.reduce((sum, round) => 
      sum + (round.girByDistance?.[interval.label]?.gir || 0), 0
    );
    return {
      name: interval.label,
      total,
      gir,
      percentage: total > 0 ? (gir / total) * 100 : 0
    };
  }).filter(item => item.total > 0);

  const averageFirstPuttDistanceData = useMemo(() => {
    if (!roundStats || roundStats.length === 0) return [];
    
    console.log('Calculating averageFirstPuttDistanceData with roundStats:', roundStats);
    
    // Aggregate average first putt distances by GIR distance range across all rounds
    const aggregated: { [key: string]: { totalDistance: number; count: number } } = {};
    
    roundStats.forEach(round => {
      console.log('Processing round:', round.courseName);
      console.log('Round girByDistance:', round.girByDistance);
      
      if (round.girByDistance) {
        Object.entries(round.girByDistance).forEach(([distance, data]: [string, any]) => {
          console.log(`Distance ${distance}:`, data);
          
          if (!aggregated[distance]) {
            aggregated[distance] = { totalDistance: 0, count: 0 };
          }
          // Only include ranges where there are actual GIR holes
          if (data.gir > 0 && data.averageFirstPuttDistance > 0) {
            console.log(`Adding to ${distance}: distance=${data.averageFirstPuttDistance}, count=${data.gir}`);
            aggregated[distance].totalDistance += data.averageFirstPuttDistance * data.gir;
            aggregated[distance].count += data.gir;
          }
        });
      }
    });
    
    console.log('Final aggregated data:', aggregated);
    
    const result = Object.entries(aggregated)
      .filter(([_, data]) => data.count > 0)
      .map(([distance, data]) => ({
        name: distance,
        averageDistance: Math.round((data.totalDistance / data.count) * 10) / 10
      }))
      .sort((a, b) => {
        // Sort by distance range (extract numbers for proper sorting)
        const aNum = parseInt(a.name.split('-')[0]);
        const bNum = parseInt(b.name.split('-')[0]);
        return aNum - bNum;
      });
    
    console.log('Final result:', result);
    return result;
  }, [roundStats]);

  const makeRatePuttsData = useMemo(() => {
    if (!roundStats || roundStats.length === 0) return [];
    
    // Aggregate make rate putts across all rounds
    const aggregated: { [key: string]: { total: number; made: number } } = {};
    
    roundStats.forEach(round => {
      if (round.makeRatePutts) {
        Object.entries(round.makeRatePutts).forEach(([distance, percentage]: [string, any]) => {
          if (!aggregated[distance]) {
            aggregated[distance] = { total: 0, made: 0 };
          }
          // Since we now only store ranges with actual putts, we can calculate the average percentage
          aggregated[distance].total += 1;
          aggregated[distance].made += percentage || 0;
        });
      }
    });
    
    return Object.entries(aggregated)
      .map(([distance, data]) => ({
        name: distance,
        value: data.total > 0 ? (data.made / data.total) : 0
      }))
      .sort((a, b) => {
        // Sort by distance range (extract numbers for proper sorting)
        const aNum = parseInt(a.name.split('-')[0]);
        const bNum = parseInt(b.name.split('-')[0]);
        return aNum - bNum;
      });
  }, [roundStats]);



  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-masters-green text-lg">Cargando estadísticas...</div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-masters-green text-lg">Usuario no autenticado</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter */}
      <div className="card">
        <h3 className="text-lg font-semibold text-masters-dark-green mb-4">Filtro de Estadísticas</h3>
        <div className="flex gap-2 flex-wrap">
          {(['Todas', 'Últimas 5 rondas', 'Últimas 20 rondas'] as FilterOption[]).map((option) => (
            <button
              key={option}
              onClick={() => setFilter(option)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === option 
                  ? 'bg-masters-green text-white' 
                  : 'bg-white text-masters-dark-green border border-masters-green/30 hover:bg-masters-green/10'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {/* No Data Message */}
      {!loading && (!roundStats || roundStats.length === 0) && (
        <div className="card text-center">
          <h3 className="text-lg font-semibold text-masters-dark-green mb-2">No hay estadísticas</h3>
          <p className="text-masters-dark-green">
            Aún no has guardado ninguna ronda. Ve a "Nueva Ronda" para comenzar a registrar tus estadísticas.
          </p>
        </div>
      )}

      {/* Average Stats */}
      {averageStats && (
        <>
          {/* Estadísticas Generales */}
          <div className="card">
            <h3 className="text-lg font-semibold text-masters-dark-green mb-4">Estadísticas Generales (Todas las Rondas)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="card text-center">
                <h4 className="text-sm font-medium text-masters-dark-green mb-2">Score Promedio</h4>
                <p className="text-3xl font-bold text-masters-green">{averageStats.averageScore?.toFixed(1) || '0.0'}</p>
                <p className="text-xs text-masters-dark-green mt-1">Normalizado a 18 hoyos</p>
              </div>
              <div className="card text-center">
                <h4 className="text-sm font-medium text-masters-dark-green mb-2">FIR %</h4>
                <p className="text-3xl font-bold text-masters-green">{averageStats.averageFir?.toFixed(1) || '0.0'}%</p>
              </div>
              <div className="card text-center">
                <h4 className="text-sm font-medium text-masters-dark-green mb-2">GIR %</h4>
                <p className="text-3xl font-bold text-masters-green">{averageStats.averageGir?.toFixed(1) || '0.0'}%</p>
              </div>
              <div className="card text-center">
                <h4 className="text-sm font-medium text-masters-dark-green mb-2">Putts Promedio</h4>
                <p className="text-3xl font-bold text-masters-green">{averageStats.averagePutts?.toFixed(1) || '0.0'}</p>
                <p className="text-xs text-masters-dark-green mt-1">Normalizado a 18 hoyos</p>
              </div>
            </div>
          </div>

          {/* Estadísticas por Número de Hoyos */}
          <div className="card">
            <h3 className="text-lg font-semibold text-masters-dark-green mb-4">Estadísticas por Número de Hoyos</h3>
            
            {/* Score por Número de Hoyos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="text-center">
                <h4 className="text-lg font-medium text-masters-dark-green mb-3">Rondas de 9 Hoyos</h4>
                <div className="grid grid-cols-1 gap-3">
                  <div className="card text-center">
                    <h5 className="text-sm font-medium text-masters-dark-green mb-1">Score Promedio</h5>
                    <p className="text-2xl font-bold text-masters-green">
                      {averageStats.averageScore9Holes !== null ? averageStats.averageScore9Holes.toFixed(1) : 'N/A'}
                    </p>
                  </div>
                  <div className="card text-center">
                    <h5 className="text-sm font-medium text-masters-dark-green mb-1">FIR %</h5>
                    <p className="text-xl font-bold text-masters-green">
                      {averageStats.averageFir9Holes !== null ? `${averageStats.averageFir9Holes.toFixed(1)}%` : 'N/A'}
                    </p>
                  </div>
                  <div className="card text-center">
                    <h5 className="text-sm font-medium text-masters-dark-green mb-1">GIR %</h5>
                    <p className="text-xl font-bold text-masters-green">
                      {averageStats.averageGir9Holes !== null ? `${averageStats.averageGir9Holes.toFixed(1)}%` : 'N/A'}
                    </p>
                  </div>
                  <div className="card text-center">
                    <h5 className="text-sm font-medium text-masters-dark-green mb-1">Putts Promedio</h5>
                    <p className="text-xl font-bold text-masters-green">
                      {averageStats.averagePutts9Holes !== null ? averageStats.averagePutts9Holes.toFixed(1) : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <h4 className="text-lg font-medium text-masters-dark-green mb-3">Rondas de 18 Hoyos</h4>
                <div className="grid grid-cols-1 gap-3">
                  <div className="card text-center">
                    <h5 className="text-sm font-medium text-masters-dark-green mb-1">Score Promedio</h5>
                    <p className="text-2xl font-bold text-masters-green">
                      {averageStats.averageScore18Holes !== null ? averageStats.averageScore18Holes.toFixed(1) : 'N/A'}
                    </p>
                  </div>
                  <div className="card text-center">
                    <h5 className="text-sm font-medium text-masters-dark-green mb-1">FIR %</h5>
                    <p className="text-xl font-bold text-masters-green">
                      {averageStats.averageFir18Holes !== null ? `${averageStats.averageFir18Holes.toFixed(1)}%` : 'N/A'}
                    </p>
                  </div>
                  <div className="card text-center">
                    <h5 className="text-sm font-medium text-masters-dark-green mb-1">GIR %</h5>
                    <p className="text-xl font-bold text-masters-green">
                      {averageStats.averageGir18Holes !== null ? `${averageStats.averageGir18Holes.toFixed(1)}%` : 'N/A'}
                    </p>
                  </div>
                  <div className="card text-center">
                    <h5 className="text-sm font-medium text-masters-dark-green mb-1">Putts Promedio</h5>
                    <p className="text-xl font-bold text-masters-green">
                      {averageStats.averagePutts18Holes !== null ? averageStats.averagePutts18Holes.toFixed(1) : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Diferencia entre Rondas de 9 y 18 Hoyos */}
            {averageStats.averageScore9Holes !== null && averageStats.averageScore18Holes !== null && (
              <div className="card">
                <h4 className="text-lg font-medium text-masters-dark-green mb-4 text-center">Comparación: 9 vs 18 Hoyos</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="text-center">
                    <h5 className="text-sm font-medium text-masters-dark-green mb-2">Diferencia en Score</h5>
                    {(() => {
                      const scoreDiff = averageStats.averageScore9Holes! - averageStats.averageScore18Holes!;
                      const isBetter = scoreDiff < 0;
                      return (
                        <div className="flex items-center justify-center space-x-2">
                          <span className={`text-2xl font-bold ${isBetter ? 'text-green-600' : 'text-red-600'}`}>
                            {isBetter ? '↓' : '↑'} {Math.abs(scoreDiff).toFixed(1)}
                          </span>
                          <span className="text-sm text-masters-dark-green">
                            {isBetter ? 'Mejor en 9 hoyos' : 'Mejor en 18 hoyos'}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                  
                  <div className="text-center">
                    <h5 className="text-sm font-medium text-masters-dark-green mb-2">Diferencia en Putts</h5>
                    {(() => {
                      const puttsDiff = averageStats.averagePutts9Holes! - averageStats.averagePutts18Holes!;
                      const isBetter = puttsDiff < 0;
                      return (
                        <div className="flex items-center justify-center space-x-2">
                          <span className={`text-2xl font-bold ${isBetter ? 'text-green-600' : 'text-red-600'}`}>
                            {isBetter ? '↓' : '↑'} {Math.abs(puttsDiff).toFixed(1)}
                          </span>
                          <span className="text-sm text-masters-dark-green">
                            {isBetter ? 'Mejor en 9 hoyos' : 'Mejor en 18 hoyos'}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* GIR by Distance Chart */}
      {girByDistanceData.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-masters-dark-green mb-4">GIR por Distancia</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={girByDistanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                formatter={(value: any, _name: any) => [`${value.toFixed(1)}%`, 'Porcentaje GIR']}
                labelFormatter={(label) => `Rango: ${label}`}
              />
              <Bar dataKey="percentage" fill="#0F5132" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Average First Putt Distance by GIR Distance Range Chart */}
      {roundStats.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-masters-dark-green mb-4">Distancia Promedio al Hoyo por Rango de GIR</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={averageFirstPuttDistanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                formatter={(value: any, _name: any) => [`${value} ft`, 'Distancia Promedio']}
                labelFormatter={(label) => `Rango: ${label}`}
              />
              <Bar dataKey="averageDistance" fill="#D4AF37" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Make Rate Putts Chart */}
      {roundStats.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-masters-dark-green mb-4">Porcentaje de Acierto por Distancia de Putt (Solo Rangos con Putts)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={makeRatePuttsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                formatter={(value: any, _name: any) => [`${value.toFixed(1)}%`, 'Porcentaje de Acierto']}
                labelFormatter={(label) => `Rango: ${label}`}
              />
              <Bar dataKey="value" fill="#0F5132" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Additional Stats */}
      {averageStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card text-center">
            <h4 className="text-sm font-medium text-masters-dark-green mb-2">Scrambling %</h4>
            <p className="text-2xl font-bold text-masters-green">
              {averageStats.averageScrambling !== null ? `${averageStats.averageScrambling.toFixed(1)}%` : 'N/A'}
            </p>
          </div>
          <div className="card text-center">
            <h4 className="text-sm font-medium text-masters-dark-green mb-2">Sand Save %</h4>
            <p className="text-2xl font-bold text-masters-green">
              {averageStats.averageSandSave !== null ? `${averageStats.averageSandSave.toFixed(1)}%` : 'N/A'}
            </p>
          </div>
          <div className="card text-center">
            <h4 className="text-sm font-medium text-masters-dark-green mb-2">Penalidades</h4>
            <p className="text-2xl font-bold text-masters-green">{averageStats.averagePenalties?.toFixed(1) || '0.0'}</p>
          </div>
        </div>
      )}

      {/* Recent Rounds */}
      {roundStats.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-masters-dark-green mb-4">Rondas Recientes</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-masters-green/20">
                  <th className="text-left py-2">Fecha</th>
                  <th className="text-left py-2">Campo</th>
                  <th className="text-left py-2">Hoyos</th>
                  <th className="text-left py-2">Score</th>
                  <th className="text-left py-2">FIR %</th>
                  <th className="text-left py-2">GIR %</th>
                  <th className="text-left py-2">Putts</th>
                  <th className="text-left py-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {roundStats.slice(0, 10).map((round, index) => (
                  <tr key={round.id || index} className="border-b border-masters-green/10">
                    <td className="py-2">{new Date(round.timestamp || '').toLocaleDateString()}</td>
                    <td className="py-2">{round.courseName || 'N/A'}</td>
                    <td className="py-2">{round.totalHoles || 18}</td>
                    <td className="py-2 font-medium">{round.totalScore || 0}</td>
                    <td className="py-2">{round.firPercentage?.toFixed(1) || '0.0'}%</td>
                    <td className="py-2">{round.girPercentage?.toFixed(1) || '0.0'}%</td>
                    <td className="py-2">{round.totalPutts || 0}</td>
                    <td className="py-2">
                      <button
                        onClick={() => handleDeleteRound(round.id!)}
                        disabled={deletingRound === round.id}
                        className="text-red-600 hover:text-red-800 transition-colors disabled:opacity-50"
                        title="Eliminar ronda"
                      >
                        {deletingRound === round.id ? (
                          <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          '🗑️'
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
} 