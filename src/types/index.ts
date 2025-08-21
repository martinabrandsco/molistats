export interface HoleStats {
  holeNumber: number;
  par: number;
  score: number;
  fir: 'Sí' | 'No' | 'NA';
  gir: 'Sí' | 'No';
  girDistance: number;
  putts: number;
  upAndDown: 'Sí' | 'No' | 'NA';
  sandSave: 'Sí' | 'No' | 'NA';
  penalty: 'Sí' | 'No';
  firstPuttDistance: number;
}

export interface RoundStats {
  id?: string;
  timestamp: string;
  courseName: string;
  totalHoles: number;
  totalScore: number;
  firPercentage: number;
  girPercentage: number;
  girByDistance: {
    [key: string]: {
      total: number;
      gir: number;
      percentage: number;
      averageFirstPuttDistance: number;
    };
  };
  totalPutts: number;
  scramblingPercentage: number;
  sandSavePercentage: number;
  totalPenalties: number;
  firstPuttDistances: {
    '4-6ft': number;
    '7-10ft': number;
    '11-16ft': number;
    '17-30ft': number;
  };
  makeRatePutts: {
    [key: string]: number;
  };
  averageScoreByPar: {
    par3: number;
    par4: number;
    par5: number;
  };
  userId?: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface DistanceInterval {
  label: string;
  min: number;
  max: number;
}

export type FilterOption = 'Todas' | 'Última Ronda' | 'Últimas 5 rondas' | 'Últimas 20 rondas'; 