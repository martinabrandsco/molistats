import { HoleStats, RoundStats, DistanceInterval } from '../types';

export const DISTANCE_INTERVALS: DistanceInterval[] = [
  { label: '40-50m', min: 40, max: 50 },
  { label: '50-60m', min: 50, max: 60 },
  { label: '60-70m', min: 60, max: 70 },
  { label: '70-80m', min: 70, max: 80 },
  { label: '80-90m', min: 80, max: 90 },
  { label: '90-100m', min: 90, max: 100 },
  { label: '100-110m', min: 100, max: 110 },
  { label: '110-120m', min: 110, max: 120 },
  { label: '120-130m', min: 120, max: 130 },
  { label: '130-140m', min: 130, max: 140 },
  { label: '140-150m', min: 140, max: 150 },
  { label: '150-160m', min: 150, max: 160 },
  { label: '160-170m', min: 160, max: 170 },
  { label: '170-180m', min: 170, max: 180 },
  { label: '180-190m', min: 180, max: 190 },
  { label: '190-200m', min: 190, max: 200 },
  { label: '200-210m', min: 200, max: 210 },
];

export function calculateRoundStats(holes: HoleStats[], courseName: string): RoundStats {
  const totalScore = holes.reduce((sum, hole) => sum + hole.score, 0);
  const totalHoles = holes.length;
  
  // FIR calculation
  const firResponses = holes.filter(hole => hole.fir !== 'NA');
  const firYes = firResponses.filter(hole => hole.fir === 'Sí').length;
  const firPercentage = firResponses.length > 0 ? (firYes / firResponses.length) * 100 : 0;
  
  // GIR calculation
  const girYes = holes.filter(hole => hole.gir === 'Sí').length;
  const girPercentage = (girYes / holes.length) * 100;
  
  // GIR by distance
  const girByDistance: { [key: string]: { total: number; gir: number; percentage: number; averageFirstPuttDistance: number } } = {};
  DISTANCE_INTERVALS.forEach(interval => {
    const holesInInterval = holes.filter(hole => 
      hole.girDistance >= interval.min && hole.girDistance < interval.max
    );
    const girInInterval = holesInInterval.filter(hole => hole.gir === 'Sí').length;
    
    // Calculate average first putt distance for GIR holes in this distance range
    const girHolesInInterval = holesInInterval.filter(hole => hole.gir === 'Sí');
    const totalFirstPuttDistance = girHolesInInterval.reduce((sum, hole) => sum + hole.firstPuttDistance, 0);
    const averageFirstPuttDistance = girHolesInInterval.length > 0 ? totalFirstPuttDistance / girHolesInInterval.length : 0;
    
    girByDistance[interval.label] = {
      total: holesInInterval.length,
      gir: girInInterval,
      percentage: holesInInterval.length > 0 ? (girInInterval / holesInInterval.length) * 100 : 0,
      averageFirstPuttDistance: Math.round(averageFirstPuttDistance * 10) / 10 // Round to 1 decimal place
    };
  });
  
  // Total putts
  const totalPutts = holes.reduce((sum, hole) => sum + hole.putts, 0);
  
  // Scrambling (Up & Down)
  const scramblingResponses = holes.filter(hole => hole.upAndDown !== 'NA');
  const scramblingYes = scramblingResponses.filter(hole => hole.upAndDown === 'Sí').length;
  const scramblingPercentage = scramblingResponses.length > 0 ? (scramblingYes / scramblingResponses.length) * 100 : 0;
  
  // Sand Saves
  const sandSaveResponses = holes.filter(hole => hole.sandSave !== 'NA');
  const sandSaveYes = sandSaveResponses.filter(hole => hole.sandSave === 'Sí').length;
  const sandSavePercentage = sandSaveResponses.length > 0 ? (sandSaveYes / sandSaveResponses.length) * 100 : 0;
  
  // Penalties
  const totalPenalties = holes.filter(hole => hole.penalty === 'Sí').length;
  
  // First putt distances
  const firstPuttDistances = {
    '4-6ft': holes.filter(hole => hole.firstPuttDistance >= 4 && hole.firstPuttDistance <= 6).length,
    '7-10ft': holes.filter(hole => hole.firstPuttDistance >= 7 && hole.firstPuttDistance <= 10).length,
    '11-16ft': holes.filter(hole => hole.firstPuttDistance >= 11 && hole.firstPuttDistance <= 16).length,
    '17-30ft': holes.filter(hole => hole.firstPuttDistance >= 17 && hole.firstPuttDistance <= 30).length,
  };
  
  // Make rate putts (putts = 1 means made) - only include ranges with actual putts
  const makeRatePutts: { [key: string]: number } = {};
  
  const ranges = [
    { key: '4-6ft', min: 4, max: 6 },
    { key: '7-10ft', min: 7, max: 10 },
    { key: '11-16ft', min: 11, max: 16 },
    { key: '17-30ft', min: 17, max: 30 }
  ];
  
  ranges.forEach(range => {
    const holesInRange = holes.filter(hole => 
      hole.firstPuttDistance >= range.min && hole.firstPuttDistance <= range.max
    );
    
    // Only include range if there are actual putts in it
    if (holesInRange.length > 0) {
      makeRatePutts[range.key] = calculateMakeRate(holes, range.min, range.max);
    }
  });
  
  return {
    timestamp: new Date().toISOString(),
    courseName: courseName,
    totalHoles: totalHoles,
    totalScore: totalScore,
    firPercentage: firPercentage,
    girPercentage: girPercentage,
    girByDistance: girByDistance,
    totalPutts: totalPutts,
    scramblingPercentage: scramblingPercentage,
    sandSavePercentage: sandSavePercentage,
    totalPenalties: totalPenalties,
    firstPuttDistances: firstPuttDistances,
    makeRatePutts: makeRatePutts,
  };
}

function calculateMakeRate(holes: HoleStats[], minDistance: number, maxDistance: number): number {
  const holesInRange = holes.filter(hole => 
    hole.firstPuttDistance >= minDistance && hole.firstPuttDistance <= maxDistance
  );
  const madePutts = holesInRange.filter(hole => hole.putts === 1).length;
  return holesInRange.length > 0 ? (madePutts / holesInRange.length) * 100 : 0;
}

export function validateHoleStats(stats: HoleStats): boolean {
  return (
    stats.holeNumber >= 1 && stats.holeNumber <= 18 &&
    stats.par >= 3 && stats.par <= 5 &&
    stats.score > 0 &&
    stats.girDistance >= 0 &&
    stats.putts > 0 &&
    stats.firstPuttDistance >= 0
  );
} 