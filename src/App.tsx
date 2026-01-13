import React, { useState, useEffect, useMemo } from 'react';
import { 
  PlusCircle, 
  History, 
  BarChart3, 
  Settings, 
  Trash2,
  AlertCircle
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  Cell
} from 'recharts';
import { 
  format, 
  startOfDay, 
  subDays, 
  isSameDay, 
  eachDayOfInterval,
  addHours
} from 'date-fns';

type NicotineSource = 'cigarettes' | 'pouches' | 'vape' | 'lozenge' | 'patch';
type PreferredUnit = 'cigs' | 'pouches' | 'puffs' | 'vape_cadence' | 'lozenge' | 'patch';

interface UserConfig {
  source: NicotineSource;
  unit: PreferredUnit;
  pouchStrength?: 3 | 6;
  daysPerVape?: number;
  lozengeStrength?: number;
  patchStrength?: number;
}

interface DailyLog {
  date: string; // YYYY-MM-DD
  unitType: PreferredUnit;
  quantity: number;
}

const NICOTINE_MG_PER_CIG = 2.0;
const ABSORBED_MG_PER_POUCH_3MG = 1.5;
const ABSORBED_MG_PER_POUCH_6MG = 3.0;
const ABSORBED_MG_PER_PUFF = 0.08;
const PUFFS_PER_DEVICE = 5000;
const LOZENGE_ABSORPTION_RATE = 0.5;
const PATCH_ABSORPTION_RATE = 1.0;

const Quiz: React.FC<{ 
  onComplete: (config: UserConfig, initialLog?: number) => void,
  currentConfig: UserConfig | null
}> = ({ onComplete, currentConfig }) => {
  const [step, setStep] = useState(1);
  const [source, setSource] = useState<NicotineSource | ''>(currentConfig?.source || '');
  const [unit, setUnit] = useState<PreferredUnit | ''>(currentConfig?.unit || '');
  const [pouchStrength, setPouchStrength] = useState<3 | 6>(currentConfig?.pouchStrength || 6);
  const [daysPerVape, setDaysPerVape] = useState<number>(currentConfig?.daysPerVape || 1);
  const [lozengeStrength, setLozengeStrength] = useState<number>(currentConfig?.lozengeStrength || 4);
  const [patchStrength, setPatchStrength] = useState<number>(currentConfig?.patchStrength || 21);
  const [initialLog, setInitialLog] = useState<string>('');

  const handleNext = () => {
    if (step === 1 && source) setStep(2);
    else if (step === 2 && unit) {
      if (unit === 'pouches' || unit === 'vape_cadence' || unit === 'lozenge' || unit === 'patch') setStep(3);
      else setStep(4);
    }
    else if (step === 3) setStep(4);
  };

  const handleFinish = () => {
    onComplete({
      source: source as NicotineSource,
      unit: unit as PreferredUnit,
      pouchStrength: (unit === 'pouches' || source === 'pouches') ? pouchStrength : undefined,
      daysPerVape: (unit === 'vape_cadence' || source === 'vape') ? daysPerVape : undefined,
      lozengeStrength: (unit === 'lozenge' || source === 'lozenge') ? lozengeStrength : undefined,
      patchStrength: (unit === 'patch' || source === 'patch') ? patchStrength : undefined,
    }, initialLog ? parseFloat(initialLog) : undefined);
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 max-w-md w-full space-y-6">
      <div className="flex justify-between items-center mb-4">
        <span className="text-xs font-bold text-blue-500 uppercase tracking-widest">Step {step} of 4</span>
        <div className="flex gap-1">
          {[1,2,3,4].map(s => (
            <div key={s} className={`h-1 w-6 rounded-full ${s <= step ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
          ))}
        </div>
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">What is your nicotine source?</h2>
          <div className="grid gap-3">
            {[
              { id: 'cigarettes', label: 'Cigarettes', icon: '🚬' },
              { id: 'pouches', label: 'Nicotine Pouches', icon: '📦' },
              { id: 'vape', label: 'Disposable Vape', icon: '💨' },
              { id: 'lozenge', label: 'Lozenges', icon: '🍬' },
              { id: 'patch', label: 'Nicotine Patch', icon: '🩹' }
            ].map(opt => (
              <button
                key={opt.id}
                onClick={() => {
                  setSource(opt.id as NicotineSource);
                  if (opt.id === 'cigarettes') setUnit('cigs');
                  else if (opt.id === 'pouches') setUnit('pouches');
                  else if (opt.id === 'vape') setUnit('');
                  else if (opt.id === 'lozenge') setUnit('lozenge');
                  else if (opt.id === 'patch') setUnit('patch');
                }}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${source === opt.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-100 dark:border-gray-700 hover:border-gray-200'}`}
              >
                <span className="text-2xl">{opt.icon}</span>
                <span className="font-semibold">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Preferred tracking unit</h2>
          <div className="grid gap-3">
            {source === 'cigarettes' && (
              <button
                onClick={() => setUnit('cigs')}
                className={`p-4 rounded-xl border-2 text-left ${unit === 'cigs' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-100 dark:border-gray-700'}`}
              >
                <p className="font-semibold">Cigarettes per day</p>
              </button>
            )}
            {source === 'pouches' && (
              <button
                onClick={() => setUnit('pouches')}
                className={`p-4 rounded-xl border-2 text-left ${unit === 'pouches' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-100 dark:border-gray-700'}`}
              >
                <p className="font-semibold">Pouches per day</p>
              </button>
            )}
            {source === 'vape' && (
              <>
                <button
                  onClick={() => setUnit('puffs')}
                  className={`p-4 rounded-xl border-2 text-left ${unit === 'puffs' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-100 dark:border-gray-700'}`}
                >
                  <p className="font-semibold">Vape puffs per day</p>
                </button>
                <button
                  onClick={() => setUnit('vape_cadence')}
                  className={`p-4 rounded-xl border-2 text-left ${unit === 'vape_cadence' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-100 dark:border-gray-700'}`}
                >
                  <p className="font-semibold">Device cadence</p>
                  <p className="text-xs text-gray-500">"I finish 1 disposable every X days"</p>
                </button>
              </>
            )}
            {source === 'lozenge' && (
              <button
                onClick={() => setUnit('lozenge')}
                className={`p-4 rounded-xl border-2 text-left ${unit === 'lozenge' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-100 dark:border-gray-700'}`}
              >
                <p className="font-semibold">Lozenges per day</p>
              </button>
            )}
            {source === 'patch' && (
              <button
                onClick={() => setUnit('patch')}
                className={`p-4 rounded-xl border-2 text-left ${unit === 'patch' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-100 dark:border-gray-700'}`}
              >
                <p className="font-semibold">Patches per day</p>
              </button>
            )}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Product Detail</h2>
          {unit === 'pouches' ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-500">Select pouch strength:</p>
              <div className="flex gap-4">
                {[3, 6].map(s => (
                  <button
                    key={s}
                    onClick={() => setPouchStrength(s as 3|6)}
                    className={`flex-1 p-4 rounded-xl border-2 font-bold ${pouchStrength === s ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-100 dark:border-gray-700'}`}
                  >
                    {s} mg
                  </button>
                ))}
              </div>
            </div>
          ) : unit === 'vape_cadence' ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-500">How many days per disposable? (e.g. 5)</p>
              <input 
                type="number"
                step="0.5"
                min="0.5"
                autoFocus
                value={daysPerVape}
                onChange={(e) => setDaysPerVape(parseFloat(e.target.value))}
                className="w-full p-4 rounded-xl border-2 border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:border-blue-500 outline-none"
              />
            </div>
          ) : unit === 'lozenge' ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-500">Lozenge strength (mg):</p>
              <input 
                type="number"
                step="0.5"
                min="0.5"
                autoFocus
                value={lozengeStrength}
                onChange={(e) => setLozengeStrength(parseFloat(e.target.value))}
                className="w-full p-4 rounded-xl border-2 border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:border-blue-500 outline-none"
              />
            </div>
          ) : unit === 'patch' ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-500">Patch strength (mg):</p>
              <input 
                type="number"
                step="0.5"
                min="0.5"
                autoFocus
                value={patchStrength}
                onChange={(e) => setPatchStrength(parseFloat(e.target.value))}
                className="w-full p-4 rounded-xl border-2 border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:border-blue-500 outline-none"
              />
            </div>
          ) : null}
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Starting Value</h2>
          <p className="text-sm text-gray-500">Optional: How many {unit.replace('_', ' ')} today?</p>
          <input 
            type="number"
            min="0"
            placeholder="0"
            autoFocus
            value={initialLog}
            onChange={(e) => setInitialLog(e.target.value)}
            className="w-full p-4 rounded-xl border-2 border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:border-blue-500 outline-none"
          />
        </div>
      )}

      <div className="flex gap-3 pt-4">
        {step > 1 && (
          <button 
            onClick={() => setStep(step - 1)}
            className="flex-1 p-4 rounded-xl border-2 border-gray-100 dark:border-gray-700 font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
          >
            Back
          </button>
        )}
        {step < 4 ? (
          <button 
            onClick={handleNext}
            disabled={step === 1 ? !source : step === 2 ? !unit : false}
            className="flex-1 p-4 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all disabled:opacity-50 shadow-lg shadow-blue-500/30"
          >
            Next
          </button>
        ) : (
          <button 
            onClick={handleFinish}
            className="flex-1 p-4 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30"
          >
            Finish
          </button>
        )}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [config, setConfig] = useState<UserConfig | null>(() => {
    const saved = localStorage.getItem('nic_config');
    return saved ? JSON.parse(saved) : null;
  });

  const [logs, setLogs] = useState<DailyLog[]>(() => {
    const saved = localStorage.getItem('nic_logs_v2');
    return saved ? JSON.parse(saved) : [];
  });

  const [showQuiz, setShowQuiz] = useState(!config);
  const [viewDays, setViewDays] = useState(7);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (config) {
      localStorage.setItem('nic_config', JSON.stringify(config));
    }
  }, [config]);

  useEffect(() => {
    localStorage.setItem('nic_logs_v2', JSON.stringify(logs));
  }, [logs]);

  const addLog = (quantity: number, unitType: PreferredUnit, dateStr: string = format(new Date(), 'yyyy-MM-dd')) => {
    setLogs(prev => {
      const existing = prev.find(l => l.date === dateStr && l.unitType === unitType);
      if (existing) {
        return prev.map(l => (l.date === dateStr && l.unitType === unitType) ? { ...l, quantity: l.quantity + quantity } : l);
      }
      return [...prev, { date: dateStr, unitType, quantity }];
    });
  };

  const getAbsorbedMg = (log: DailyLog) => {
    if (!config) return 0;
    switch (log.unitType) {
      case 'cigs':
        return log.quantity * NICOTINE_MG_PER_CIG;
      case 'pouches':
        const strength = config.pouchStrength || 6;
        const perPouch = strength === 3 ? ABSORBED_MG_PER_POUCH_3MG : ABSORBED_MG_PER_POUCH_6MG;
        return log.quantity * perPouch;
      case 'puffs':
        return log.quantity * ABSORBED_MG_PER_PUFF;
      case 'vape_cadence':
        const daysPerVape = config.daysPerVape || 1;
        const puffsPerDay = PUFFS_PER_DEVICE / daysPerVape;
        return log.quantity * puffsPerDay * ABSORBED_MG_PER_PUFF;
      case 'lozenge':
        return log.quantity * (config.lozengeStrength || 4.0) * LOZENGE_ABSORPTION_RATE;
      case 'patch':
        return log.quantity * (config.patchStrength || 21.0) * PATCH_ABSORPTION_RATE;
      default:
        return 0;
    }
  };

  const chartData = useMemo(() => {
    const end = startOfDay(new Date());
    const start = subDays(end, viewDays - 1);
    const interval = eachDayOfInterval({ start, end });

    return interval.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayLogs = logs.filter(l => l.date === dateStr);
      
      const totalMg = dayLogs.reduce((sum, log) => sum + getAbsorbedMg(log), 0);
      
      return {
        date: format(day, 'MMM dd'),
        mg: Number(totalMg.toFixed(1)),
        cigarettes: Number((totalMg / NICOTINE_MG_PER_CIG).toFixed(1)),
      };
    });
  }, [logs, viewDays, config]);

  const todayTotal = useMemo(() => {
    const today = chartData[chartData.length - 1];
    return today ? today.mg : 0;
  }, [chartData]);

  const clearAll = () => {
    if (confirm('Are you sure you want to clear all data?')) {
      setLogs([]);
    }
  };

  const removeLog = (date: string, unitType: PreferredUnit) => {
    setLogs(logs.filter(l => !(l.date === date && l.unitType === unitType)));
  };

  const getUnitIcon = (unit: PreferredUnit) => {
    switch (unit) {
      case 'cigs': return '🚬';
      case 'pouches': return '📦';
      case 'lozenge': return '🍬';
      case 'patch': return '🩹';
      case 'puffs':
      case 'vape_cadence': return '💨';
      default: return '❓';
    }
  };

  if (showQuiz) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4 md:p-8 flex items-center justify-center">
        <Quiz 
          onComplete={(newConfig, initialValue) => {
            setConfig(newConfig);
            setShowQuiz(false);
            if (initialValue !== undefined) {
              addLog(initialValue, newConfig.unit);
            }
          }} 
          currentConfig={config}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-400">NicTrack</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Track your daily nicotine journey</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
              title="Settings"
            >
              <Settings size={20} />
            </button>
            <button 
              onClick={clearAll}
              className="p-2 text-gray-400 hover:text-red-500 transition-colors"
              title="Clear all data"
            >
              <Trash2 size={20} />
            </button>
          </div>
        </header>

        {showSettings && config && (
          <section className="bg-blue-50 dark:bg-gray-800 p-6 rounded-2xl border border-blue-100 dark:border-gray-700 space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Settings size={20} className="text-blue-500" />
              Settings
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Preferred Unit</label>
                <select 
                  value={config.unit}
                  onChange={(e) => setConfig({...config, unit: e.target.value as PreferredUnit})}
                  className="w-full p-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600"
                >
                  {config.source === 'cigarettes' && <option value="cigs">Cigarettes per day</option>}
                  {config.source === 'pouches' && <option value="pouches">Pouches per day</option>}
                  {config.source === 'vape' && (
                    <>
                      <option value="puffs">Vape puffs per day</option>
                      <option value="vape_cadence">Vape cadence</option>
                    </>
                  )}
                  <option value="lozenge">Lozenges</option>
                  <option value="patch">Patches</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Pouch Strength</label>
                <select 
                  value={config.pouchStrength || 6}
                  onChange={(e) => setConfig({...config, pouchStrength: parseInt(e.target.value) as 3 | 6})}
                  className="w-full p-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600"
                >
                  <option value={3}>3 mg</option>
                  <option value={6}>6 mg</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Days per Vape</label>
                <input 
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={config.daysPerVape || 1}
                  onChange={(e) => setConfig({...config, daysPerVape: parseFloat(e.target.value)})}
                  className="w-full p-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Lozenge Strength (mg)</label>
                <input 
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={config.lozengeStrength || 4}
                  onChange={(e) => setConfig({...config, lozengeStrength: parseFloat(e.target.value)})}
                  className="w-full p-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Patch Strength (mg)</label>
                <input 
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={config.patchStrength || 21}
                  onChange={(e) => setConfig({...config, patchStrength: parseFloat(e.target.value)})}
                  className="w-full p-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600"
                />
              </div>
            </div>
            <button 
              onClick={() => setShowQuiz(true)}
              className="text-sm text-blue-600 dark:text-blue-400 font-semibold hover:underline"
            >
              Re-run onboarding quiz
            </button>
          </section>
        )}

        {/* Quick Add Section */}
        <section className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-6">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <PlusCircle size={20} className="text-blue-500" />
            Quick Add Usage
          </h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button 
              onClick={() => addLog(1, 'pouches')}
              className="p-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 hover:border-blue-500 transition-all text-left"
            >
              <span className="text-xl block mb-1">📦</span>
              <span className="text-xs font-bold block">Zyn ({config?.pouchStrength || 6}mg)</span>
              <span className="text-[10px] text-gray-500 italic">+1 pouch</span>
            </button>
            <button 
              onClick={() => addLog(1, 'lozenge')}
              className="p-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 hover:border-blue-500 transition-all text-left"
            >
              <span className="text-xl block mb-1">🍬</span>
              <span className="text-xs font-bold block">Lozenge ({config?.lozengeStrength || 4}mg)</span>
              <span className="text-[10px] text-gray-500 italic">+1 unit</span>
            </button>
            <button 
              onClick={() => addLog(1, 'patch')}
              className="p-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 hover:border-blue-500 transition-all text-left"
            >
              <span className="text-xl block mb-1">🩹</span>
              <span className="text-xs font-bold block">Patch ({config?.patchStrength || 21}mg)</span>
              <span className="text-[10px] text-gray-500 italic">+1 patch</span>
            </button>
            <button 
              onClick={() => addLog(1, 'cigs')}
              className="p-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 hover:border-blue-500 transition-all text-left"
            >
              <span className="text-xl block mb-1">🚬</span>
              <span className="text-xs font-bold block">Cigarette</span>
              <span className="text-[10px] text-gray-500 italic">+1 cig</span>
            </button>
          </div>

          <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
            <p className="text-sm font-medium mb-3 text-gray-500">Log custom {config?.unit.replace('_', ' ')}</p>
            <div className="flex items-center gap-4">
              <input 
                type="number"
                min="0"
                placeholder={`Number of ${config?.unit.replace('_', ' ')}`}
                className="flex-1 p-3 rounded-xl border-2 border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:border-blue-500 outline-none transition-all"
                id="quick-add-input"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const val = parseFloat((e.target as HTMLInputElement).value);
                    if (!isNaN(val) && config) {
                      addLog(val, config.unit);
                      (e.target as HTMLInputElement).value = '';
                    }
                  }
                }}
              />
              <button
                onClick={() => {
                  const input = document.getElementById('quick-add-input') as HTMLInputElement;
                  const val = parseFloat(input.value);
                  if (!isNaN(val) && config) {
                    addLog(val, config.unit);
                    input.value = '';
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-colors"
              >
                Add
              </button>
            </div>
          </div>
          {config?.unit === 'vape_cadence' && (
             <p className="text-xs text-gray-500 mt-2 italic">Tip: Log "1" to represent one full day of your typical cadence.</p>
          )}
        </section>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">Absorbed (Est)</p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-5xl font-black text-gray-900 dark:text-white">{todayTotal}</span>
              <span className="text-xl font-medium text-gray-500">mg</span>
            </div>
            <p className="text-[10px] text-gray-400 mt-1 italic">*Estimate based on high-end conservative absorption.</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">Equiv. Cigs (Est)</p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-5xl font-black text-orange-500">{(todayTotal / NICOTINE_MG_PER_CIG).toFixed(1)}</span>
              <span className="text-xl font-medium text-gray-500">cigs</span>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">Equiv. Puffs (Est)</p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-5xl font-black text-blue-500">{(todayTotal / ABSORBED_MG_PER_PUFF).toFixed(0)}</span>
              <span className="text-xl font-medium text-gray-500">puffs</span>
            </div>
          </div>
        </div>

        {/* Graph Section */}
        <section className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 size={20} className="text-blue-500" />
              Intake History
            </h2>
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
              {[7, 14, 30].map(days => (
                <button
                  key={days}
                  onClick={() => setViewDays(days)}
                  className={`px-3 py-1 rounded-md text-sm transition-all ${
                    viewDays === days 
                    ? 'bg-white dark:bg-gray-600 shadow-sm font-bold text-blue-600 dark:text-blue-300' 
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  {days}d
                </button>
              ))}
            </div>
          </div>
          
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#37415120" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#9CA3AF' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#9CA3AF' }}
                />
                <Tooltip 
                  cursor={{ fill: '#3b82f610' }}
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    backgroundColor: '#1F2937',
                    color: '#F9FAFB'
                  }}
                  itemStyle={{ color: '#60A5FA' }}
                  formatter={(value: any, name: any) => [
                    `${value} ${name === 'mg' ? 'mg' : 'cigs'} (est.)`, 
                    name === 'mg' ? 'Absorbed' : 'Equivalent'
                  ]}
                />
                <Bar dataKey="mg" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.mg > 20 ? '#ef4444' : '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Recent History List */}
        <section className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <History size={20} className="text-blue-500" />
            Daily History
          </h2>
          <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
            {logs.length === 0 ? (
              <p className="text-center py-8 text-gray-500 italic">No logs yet. Start by adding one above!</p>
            ) : (
              [...logs].sort((a, b) => b.date.localeCompare(a.date)).map(log => (
                <div key={`${log.date}-${log.unitType}`} className="flex justify-between items-center p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-xl">
                      {getUnitIcon(log.unitType)}
                    </div>
                    <div>
                      <p className="font-semibold">{format(new Date(log.date + 'T12:00:00'), 'MMM dd, yyyy')}</p>
                      <p className="text-xs text-gray-500 capitalize">{log.unitType.replace('_', ' ')}: {log.quantity}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="block font-bold text-gray-700 dark:text-gray-300">{getAbsorbedMg(log).toFixed(1)}mg</span>
                      <span className="text-[10px] text-gray-400">estimate</span>
                    </div>
                    <button 
                      onClick={() => removeLog(log.date, log.unitType)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <footer className="text-center text-gray-500 text-xs py-4 flex flex-col items-center justify-center gap-2">
          <div className="flex items-center gap-1">
            <AlertCircle size={12} />
            <span>Nicotine numbers are high-end estimates for safety. Behavior and device variability can significantly affect actual absorption.</span>
          </div>
          <p>© 2026 NicTrack - Personal Nicotine Journey Tracker</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
