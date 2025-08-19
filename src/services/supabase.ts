import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const authService = {
  async signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { data, error };
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  onAuthStateChange(callback: (user: any) => void) {
    return supabase.auth.onAuthStateChange((_event, session) => {
      callback(session?.user || null);
    });
  }
};

export const statsService = {
  async saveRoundStats(stats: any) {
    // Map camelCase to snake_case for database
    const mappedStats = {
      course_name: stats.course_name || stats.courseName,
      total_holes: stats.total_holes || stats.totalHoles || 18,
      total_score: stats.total_score || stats.totalScore || 0,
      fir_percentage: stats.fir_percentage || stats.firPercentage || 0,
      gir_percentage: stats.gir_percentage || stats.girPercentage || 0,
      gir_by_distance: stats.gir_by_distance || stats.girByDistance || {},
      total_putts: stats.total_putts || stats.totalPutts || 0,
      scrambling_percentage: stats.scrambling_percentage !== undefined ? stats.scrambling_percentage : (stats.scramblingPercentage !== undefined ? stats.scramblingPercentage : 0),
      sand_save_percentage: stats.sand_save_percentage !== undefined ? stats.sand_save_percentage : (stats.sandSavePercentage !== undefined ? stats.sandSavePercentage : 0),
      total_penalties: stats.total_penalties || stats.totalPenalties || 0,
      first_putt_distances: stats.first_putt_distances || stats.firstPuttDistances || {},
      make_rate_putts: stats.makeRatePutts || {},
      average_score_by_par: stats.averageScoreByPar,
      user_id: stats.userId,
      timestamp: stats.timestamp || new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('round_stats')
      .insert([mappedStats])
      .select();
    return { data, error };
  },

  async getRoundStats(userId: string, filter: string = 'Todas') {
    let query = supabase
      .from('round_stats')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false });

    if (filter === 'Últimas 5 rondas') {
      query = query.limit(5);
    } else if (filter === 'Últimas 20 rondas') {
      query = query.limit(20);
    }

    const { data, error } = await query;
    
    if (error) {
      return { data: null, error };
    }

    // Map snake_case to camelCase
    const mappedData = data?.map(round => {
      const mapped = {
        id: round.id,
        timestamp: round.timestamp,
        courseName: round.course_name,
        totalHoles: round.total_holes,
        totalScore: round.total_score,
        firPercentage: round.fir_percentage,
        girPercentage: round.gir_percentage,
        girByDistance: round.gir_by_distance,
        totalPutts: round.total_putts,
        scramblingPercentage: round.scrambling_percentage,
        sandSavePercentage: round.sand_save_percentage,
        totalPenalties: round.total_penalties,
        firstPuttDistances: round.first_putt_distances,
        makeRatePutts: round.make_rate_putts || {},
        averageScoreByPar: round.average_score_by_par || { par3: 0, par4: 0, par5: 0 },
        userId: round.user_id
      };
      return mapped;
    }) || [];

    return { data: mappedData, error: null };
  },

  async deleteRoundStats(roundId: string) {
    const { error } = await supabase
      .from('round_stats')
      .delete()
      .eq('id', roundId);
    return { error };
  },

  async getAverageStats(userId: string, filter: string = 'Todas') {
    const { data, error } = await this.getRoundStats(userId, filter);
    if (error || !data || data.length === 0) {
      return { data: null, error };
    }

    // Separar rondas por número de hoyos
    const rounds9Holes = data.filter(round => round.totalHoles === 9);
    const rounds18Holes = data.filter(round => round.totalHoles === 18);

    const averages = {
      // Estadísticas generales (todas las rondas)
      averageScore: (() => {
        // Normalizar score de 9 hoyos multiplicándolo por 2 para comparar con 18 hoyos
        const normalizedScore = data.reduce((sum, round) => {
          if (round.totalHoles === 9) {
            return sum + (round.totalScore * 2); // Multiplicar por 2 para normalizar a 18 hoyos
          } else {
            return sum + round.totalScore; // 18 hoyos se mantienen igual
          }
        }, 0);
        return normalizedScore / data.length;
      })(),
      averageFir: data.reduce((sum, round) => sum + round.firPercentage, 0) / data.length,
      averageGir: data.reduce((sum, round) => sum + round.girPercentage, 0) / data.length,
      averagePutts: (() => {
        // Normalizar putts de 9 hoyos multiplicándolos por 2 para comparar con 18 hoyos
        const normalizedPutts = data.reduce((sum, round) => {
          if (round.totalHoles === 9) {
            return sum + (round.totalPutts * 2); // Multiplicar por 2 para normalizar a 18 hoyos
          } else {
            return sum + round.totalPutts; // 18 hoyos se mantienen igual
          }
        }, 0);
        return normalizedPutts / data.length;
      })(),
      averageScrambling: data.reduce((sum, round) => sum + round.scramblingPercentage, 0) / data.length,
      averageSandSave: data.reduce((sum, round) => sum + round.sandSavePercentage, 0) / data.length,
      averagePenalties: data.reduce((sum, round) => sum + round.totalPenalties, 0) / data.length,
      
      // Estadísticas separadas por número de hoyos
      averageScore9Holes: rounds9Holes.length > 0 
        ? rounds9Holes.reduce((sum, round) => sum + round.totalScore, 0) / rounds9Holes.length 
        : null,
      averageScore18Holes: rounds18Holes.length > 0 
        ? rounds18Holes.reduce((sum, round) => sum + round.totalScore, 0) / rounds18Holes.length 
        : null,
      averageFir9Holes: rounds9Holes.length > 0 
        ? rounds9Holes.reduce((sum, round) => sum + round.firPercentage, 0) / rounds9Holes.length 
        : null,
      averageFir18Holes: rounds18Holes.length > 0 
        ? rounds18Holes.reduce((sum, round) => sum + round.firPercentage, 0) / rounds18Holes.length 
        : null,
      averageGir9Holes: rounds9Holes.length > 0 
        ? rounds9Holes.reduce((sum, round) => sum + round.girPercentage, 0) / rounds9Holes.length 
        : null,
      averageGir18Holes: rounds18Holes.length > 0 
        ? rounds18Holes.reduce((sum, round) => sum + round.girPercentage, 0) / rounds18Holes.length 
        : null,
      averagePutts9Holes: rounds9Holes.length > 0 
        ? rounds9Holes.reduce((sum, round) => sum + round.totalPutts, 0) / rounds9Holes.length 
        : null,
      averagePutts18Holes: rounds18Holes.length > 0 
        ? rounds18Holes.reduce((sum, round) => sum + round.totalPutts, 0) / rounds18Holes.length 
        : null,
      
      // Media de golpes por tipo de par
      averageScoreByPar: (() => {
        const allPar3Scores = data.flatMap(round => {
          if (round.averageScoreByPar && round.averageScoreByPar.par3 > 0) {
            return Array(round.totalHoles).fill(round.averageScoreByPar.par3);
          }
          return [];
        });
        const allPar4Scores = data.flatMap(round => {
          if (round.averageScoreByPar && round.averageScoreByPar.par4 > 0) {
            return Array(round.totalHoles).fill(round.averageScoreByPar.par4);
          }
          return [];
        });
        const allPar5Scores = data.flatMap(round => {
          if (round.averageScoreByPar && round.averageScoreByPar.par5 > 0) {
            return Array(round.totalHoles).fill(round.averageScoreByPar.par5);
          }
          return [];
        });
        
        return {
          par3: allPar3Scores.length > 0 ? allPar3Scores.reduce((sum, score) => sum + score, 0) / allPar3Scores.length : 0,
          par4: allPar4Scores.length > 0 ? allPar4Scores.reduce((sum, score) => sum + score, 0) / allPar4Scores.length : 0,
          par5: allPar5Scores.length > 0 ? allPar5Scores.reduce((sum, score) => sum + score, 0) / allPar5Scores.length : 0,
        };
      })(),

      // GIR por distancia y distancia promedio del primer putt
      girByDistance: (() => {
        const distanceRanges = new Set<string>();
        const girByRange: { [key: string]: { total: number; gir: number; firstPuttDistances: number[] } } = {};

        // Recopilar todos los rangos de distancia y datos
        data.forEach(round => {
          if (round.girByDistance) {
            Object.entries(round.girByDistance).forEach(([range, stats]: [string, any]) => {
              distanceRanges.add(range);
              if (!girByRange[range]) {
                girByRange[range] = { total: 0, gir: 0, firstPuttDistances: [] };
              }
              girByRange[range].total += stats.total || 0;
              girByRange[range].gir += stats.gir || 0;
              
              // Agregar distancias del primer putt si están disponibles
              if (stats.averageFirstPuttDistance && stats.averageFirstPuttDistance > 0) {
                girByRange[range].firstPuttDistances.push(stats.averageFirstPuttDistance);
              }
            });
          }
        });

        // Calcular promedios por rango
        const result: { [key: string]: { total: number; gir: number; percentage: number; averageFirstPuttDistance: number } } = {};
        
        // Función para extraer el valor mínimo de un rango (ej: "50-60m" -> 50)
        const getMinDistance = (range: string) => {
          const match = range.match(/(\d+)/);
          return match ? parseInt(match[1]) : 0;
        };
        
        // Ordenar los rangos por distancia mínima antes de procesarlos
        const sortedRanges = Array.from(distanceRanges).sort((a, b) => getMinDistance(a) - getMinDistance(b));
        
        sortedRanges.forEach(range => {
          const data = girByRange[range];
          const percentage = data.total > 0 ? (data.gir / data.total) * 100 : 0;
          const averageFirstPuttDistance = data.firstPuttDistances.length > 0 
            ? data.firstPuttDistances.reduce((sum, dist) => sum + dist, 0) / data.firstPuttDistances.length 
            : 0;
          
          result[range] = {
            total: data.total,
            gir: data.gir,
            percentage: percentage,
            averageFirstPuttDistance: averageFirstPuttDistance
          };
        });

        return result;
      })(),

      // Porcentaje de acierto de putts por distancia
      makeRatePutts: (() => {
        const puttRanges: { [key: string]: { total: number; made: number } } = {};

        // Recopilar datos de putts por distancia
        data.forEach(round => {
          if (round.makeRatePutts) {
            Object.entries(round.makeRatePutts).forEach(([range, stats]: [string, any]) => {
              if (!puttRanges[range]) {
                puttRanges[range] = { total: 0, made: 0 };
              }
              puttRanges[range].total += stats.total || 0;
              puttRanges[range].made += stats.made || 0;
            });
          }
        });

        // Calcular porcentajes
        const result: { [key: string]: number } = {};
        Object.entries(puttRanges).forEach(([range, data]) => {
          if (data.total > 0) {
            result[range] = (data.made / data.total) * 100;
          }
        });

        return result;
      })()
    };

    return { data: averages, error: null };
  }
}; 