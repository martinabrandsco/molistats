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
      make_rate_putts: stats.make_rate_putts || stats.makeRatePutts || {},
      user_id: stats.user_id || stats.userId,
      timestamp: stats.timestamp || new Date().toISOString()
    };

    console.log('Mapped stats for database:', mappedStats);
    console.log('Scrambling percentage:', mappedStats.scrambling_percentage);
    console.log('Sand save percentage:', mappedStats.sand_save_percentage);
    console.log('GIR by distance:', mappedStats.gir_by_distance);

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
        makeRatePutts: round.make_rate_putts,
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
      averageScrambling: (() => {
        const validScrambling = data.filter(round => round.scramblingPercentage !== null && round.scramblingPercentage !== undefined);
        return validScrambling.length > 0 
          ? validScrambling.reduce((sum, round) => sum + round.scramblingPercentage!, 0) / validScrambling.length 
          : null;
      })(),
      averageSandSave: (() => {
        const validSandSave = data.filter(round => round.sandSavePercentage !== null && round.sandSavePercentage !== undefined);
        return validSandSave.length > 0 
          ? validSandSave.reduce((sum, round) => sum + round.sandSavePercentage!, 0) / validSandSave.length 
          : null;
      })(),
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
    };
    
    console.log('Calculated averages:', averages);
    console.log('Scrambling data points:', data.map(round => round.scramblingPercentage));
    console.log('Sand save data points:', data.map(round => round.sandSavePercentage));
    console.log('9 holes rounds:', rounds9Holes.length);
    console.log('18 holes rounds:', rounds18Holes.length);

    return { data: averages, error: null };
  }
}; 