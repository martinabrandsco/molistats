import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Anon Key:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'NOT SET');

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

    console.log('Mapped stats for database:', mappedStats);
    console.log('Scrambling percentage:', mappedStats.scrambling_percentage);
    console.log('Sand save percentage:', mappedStats.sand_save_percentage);
    console.log('GIR by distance:', mappedStats.gir_by_distance);
    console.log('User ID being sent:', mappedStats.user_id);
    console.log('User ID type:', typeof mappedStats.user_id);
    console.log('Original user_id from stats:', stats.user_id);
    console.log('Original userId from stats:', stats.userId);
    console.log('Stats object keys:', Object.keys(stats));
    console.log('Full stats object:', stats);

    // Verificar el estado de autenticación
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    console.log('Current authenticated user:', currentUser);
    console.log('User ID from auth:', currentUser?.id);

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
      console.log('Raw round data:', round);
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
      console.log('Mapped round data:', mapped);
      console.log('GIR by distance in mapped data:', mapped.girByDistance);
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

    console.log('Calculating averages for rounds:', data.length);
    console.log('Rounds data:', data.map(r => ({ holes: r.totalHoles, score: r.totalScore, putts: r.totalPutts })));

    // Separar rondas por número de hoyos
    const rounds9Holes = data.filter(round => round.totalHoles === 9);
    const rounds18Holes = data.filter(round => round.totalHoles === 18);

    console.log('9-hole rounds:', rounds9Holes.length);
    console.log('18-hole rounds:', rounds18Holes.length);

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
      })()
    };

    console.log('Calculated averages:', {
      averageScore9Holes: averages.averageScore9Holes,
      averageScore18Holes: averages.averageScore18Holes,
      averageFir9Holes: averages.averageFir9Holes,
      averageFir18Holes: averages.averageFir18Holes,
      averageGir9Holes: averages.averageGir9Holes,
      averageGir18Holes: averages.averageGir18Holes,
      averagePutts9Holes: averages.averagePutts9Holes,
      averagePutts18Holes: averages.averagePutts18Holes
    });

    return { data: averages, error: null };
  }
}; 