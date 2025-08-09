import { useState, useEffect } from 'react';
import { HoleStats } from '../types';
import { validateHoleStats } from '../utils/statsCalculator';

interface HoleFormProps {
  holeNumber: number;
  onNext: (stats: HoleStats) => void;
  onPrevious?: () => void;
  isLastHole?: boolean;
  initialStats?: HoleStats;
}

export function HoleForm({ holeNumber, onNext, onPrevious, isLastHole = false, initialStats }: HoleFormProps) {
  const [stats, setStats] = useState<HoleStats>({
    holeNumber,
    par: 4,
    score: 0,
    fir: 'NA',
    gir: 'No',
    girDistance: 0,
    putts: 0,
    upAndDown: 'NA',
    sandSave: 'NA',
    penalty: 'No',
    firstPuttDistance: 0,
  });

  // Update stats when holeNumber changes or when initialStats are provided
  useEffect(() => {
    console.log('HoleForm useEffect - holeNumber:', holeNumber, 'initialStats:', initialStats);
    if (initialStats && initialStats.holeNumber === holeNumber) {
      console.log('Setting stats from initialStats:', initialStats);
      setStats(initialStats);
    } else {
      console.log('Setting default stats for hole:', holeNumber);
      setStats({
        holeNumber,
        par: 4,
        score: 0,
        fir: 'NA',
        gir: 'No',
        girDistance: 0,
        putts: 0,
        upAndDown: 'NA',
        sandSave: 'NA',
        penalty: 'No',
        firstPuttDistance: 0,
      });
    }
  }, [holeNumber, initialStats]);

  const [errors, setErrors] = useState<string[]>([]);

  const handleInputChange = (field: keyof HoleStats, value: any) => {
    setStats(prev => ({ ...prev, [field]: value }));
    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const handleNext = () => {
    console.log('HoleForm handleNext called with stats:', stats);
    if (!validateHoleStats(stats)) {
      setErrors(['Por favor, completa todos los campos correctamente']);
      return;
    }
    onNext(stats);
  };

  return (
    <div className="card max-w-md mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-masters-green">Hoyo {holeNumber}</h2>
        <div className="w-16 h-1 bg-masters-yellow mx-auto mt-2"></div>
      </div>

      {errors.length > 0 && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          {errors.map((error, index) => (
            <p key={index} className="text-red-600 text-sm">{error}</p>
          ))}
        </div>
      )}

      <form className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-masters-dark-green mb-1">
              Par
            </label>
            <select
              value={stats.par}
              onChange={(e) => handleInputChange('par', parseInt(e.target.value))}
              className="input-field"
            >
              <option value={3}>3</option>
              <option value={4}>4</option>
              <option value={5}>5</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-masters-dark-green mb-1">
              Score
            </label>
            <input
              type="number"
              min="1"
              value={stats.score || ''}
              onChange={(e) => handleInputChange('score', parseInt(e.target.value) || 0)}
              className="input-field"
              placeholder="Golpes"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-masters-dark-green mb-1">
            FIR (Fairway in Regulation)
          </label>
          <select
            value={stats.fir}
            onChange={(e) => handleInputChange('fir', e.target.value as 'Sí' | 'No' | 'NA')}
            className="input-field"
          >
            <option value="NA">No aplica</option>
            <option value="Sí">Sí</option>
            <option value="No">No</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-masters-dark-green mb-1">
            GIR (Green in Regulation)
          </label>
          <select
            value={stats.gir}
            onChange={(e) => handleInputChange('gir', e.target.value as 'Sí' | 'No')}
            className="input-field"
          >
            <option value="Sí">Sí</option>
            <option value="No">No</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-masters-dark-green mb-1">
            Distancia golpe GIR (metros)
          </label>
          <input
            type="number"
            min="0"
            value={stats.girDistance || ''}
            onChange={(e) => handleInputChange('girDistance', parseInt(e.target.value) || 0)}
            className="input-field"
            placeholder="Distancia desde donde pegaste"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-masters-dark-green mb-1">
            Putts
          </label>
          <input
            type="number"
            min="0"
            value={stats.putts || ''}
            onChange={(e) => handleInputChange('putts', parseInt(e.target.value) || 0)}
            className="input-field"
            placeholder="Número de putts"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-masters-dark-green mb-1">
            Up & Down
          </label>
          <select
            value={stats.upAndDown}
            onChange={(e) => handleInputChange('upAndDown', e.target.value as 'Sí' | 'No' | 'NA')}
            className="input-field"
          >
            <option value="NA">No aplica</option>
            <option value="Sí">Sí</option>
            <option value="No">No</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-masters-dark-green mb-1">
            Sand Save
          </label>
          <select
            value={stats.sandSave}
            onChange={(e) => handleInputChange('sandSave', e.target.value as 'Sí' | 'No' | 'NA')}
            className="input-field"
          >
            <option value="NA">No aplica</option>
            <option value="Sí">Sí</option>
            <option value="No">No</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-masters-dark-green mb-1">
            Penalidad
          </label>
          <select
            value={stats.penalty}
            onChange={(e) => handleInputChange('penalty', e.target.value as 'Sí' | 'No')}
            className="input-field"
          >
            <option value="No">No</option>
            <option value="Sí">Sí</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-masters-dark-green mb-1">
            Distancia Primer Putt (ft)
          </label>
          <input
            type="number"
            min="0"
            step="0.1"
            value={stats.firstPuttDistance || ''}
            onChange={(e) => handleInputChange('firstPuttDistance', parseFloat(e.target.value) || 0)}
            className="input-field"
            placeholder="Distancia del primer putt"
          />
        </div>

        <div className="flex gap-3 pt-4">
          {onPrevious && (
            <button
              type="button"
              onClick={onPrevious}
              className="btn-secondary flex-1"
            >
              Anterior
            </button>
          )}
          <button
            type="button"
            onClick={handleNext}
            className="btn-primary flex-1"
          >
            {isLastHole ? 'Finalizar Ronda' : 'Siguiente Hoyo'}
          </button>
        </div>
      </form>
    </div>
  );
} 