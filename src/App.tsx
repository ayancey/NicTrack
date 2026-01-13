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

type IntakeType = 'lozenge' | 'zyn' | 'patch';

interface IntakeEvent {
  id: string;
  type: IntakeType;
  amount: number;
  timestamp: number;
}

const CIG_EQUIVALENT_MG = 1; // 1 cigarette ≈ 1mg absorbed nicotine

const App: React.FC = () => {
  const [events, setEvents] = useState<IntakeEvent[]>(() => {
    const saved = localStorage.getItem('nic_events');
    return saved ? JSON.parse(saved) : [];
  });

  const [viewDays, setViewDays] = useState(7);

  useEffect(() => {
    localStorage.setItem('nic_events', JSON.stringify(events));
  }, [events]);

  const addEvent = (type: IntakeType, amount: number) => {
    const newEvent: IntakeEvent = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      amount,
      timestamp: Date.now(),
    };
    setEvents([newEvent, ...events]);
  };

  const removeEvent = (id: string) => {
    setEvents(events.filter(e => e.id !== id));
  };

  const clearAll = () => {
    if (confirm('Are you sure you want to clear all data?')) {
      setEvents([]);
    }
  };

  const chartData = useMemo(() => {
    const end = startOfDay(new Date());
    const start = subDays(end, viewDays - 1);
    const interval = eachDayOfInterval({ start, end });

    return interval.map(day => {
      const dayStart = startOfDay(day);
      const dayEnd = addHours(dayStart, 24);
      
      let totalMg = 0;

      events.forEach(e => {
        const eventTime = new Date(e.timestamp);
        
        if (e.type === 'patch') {
          // Patch lasts 24 hours
          const patchStart = eventTime;
          const patchEnd = addHours(patchStart, 24);
          const ratePerHour = e.amount / 24;

          // Calculate overlap between [patchStart, patchEnd] and [dayStart, dayEnd]
          const overlapStart = new Date(Math.max(patchStart.getTime(), dayStart.getTime()));
          const overlapEnd = new Date(Math.min(patchEnd.getTime(), dayEnd.getTime()));

          if (overlapStart < overlapEnd) {
            const overlapHours = (overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60);
            totalMg += overlapHours * ratePerHour;
          }
        } else {
          // Discrete events
          if (isSameDay(eventTime, day)) {
            totalMg += e.amount;
          }
        }
      });
      
      return {
        date: format(day, 'MMM dd'),
        mg: Number(totalMg.toFixed(1)),
        cigarettes: Number((totalMg / CIG_EQUIVALENT_MG).toFixed(1)),
      };
    });
  }, [events, viewDays]);

  const todayTotal = useMemo(() => {
    const today = chartData[chartData.length - 1];
    return today ? today.mg : 0;
  }, [chartData]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-400">NicTrack</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Track your daily nicotine journey</p>
          </div>
          <button 
            onClick={clearAll}
            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
            title="Clear all data"
          >
            <Trash2 size={20} />
          </button>
        </header>

        {/* Quick Add Section */}
        <section className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <PlusCircle size={20} className="text-blue-500" />
            Log Intake
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={() => addEvent('lozenge', 4)}
              className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-blue-100 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 bg-blue-50 dark:bg-gray-700 transition-all group"
            >
              <span className="text-2xl mb-1">🍬</span>
              <span className="font-bold">Lozenge</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">4mg</span>
            </button>
            <button
              onClick={() => addEvent('zyn', 6)}
              className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-emerald-100 dark:border-gray-700 hover:border-emerald-500 dark:hover:border-emerald-500 bg-emerald-50 dark:bg-gray-700 transition-all group"
            >
              <span className="text-2xl mb-1">📦</span>
              <span className="font-bold">Zyn</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">6mg</span>
            </button>
            <button
              onClick={() => addEvent('patch', 21)}
              className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-purple-100 dark:border-gray-700 hover:border-purple-500 dark:hover:border-purple-500 bg-purple-50 dark:bg-gray-700 transition-all group"
            >
              <span className="text-2xl mb-1">🩹</span>
              <span className="font-bold">Patch</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">21mg / 24h</span>
            </button>
          </div>
        </section>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">Today's Intake</p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-5xl font-black text-gray-900 dark:text-white">{todayTotal}</span>
              <span className="text-xl font-medium text-gray-500">mg</span>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">Cigarette Equivalent</p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-5xl font-black text-orange-500">{(todayTotal / CIG_EQUIVALENT_MG).toFixed(1)}</span>
              <span className="text-xl font-medium text-gray-500">cigs</span>
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
            Recent Logs
          </h2>
          <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
            {events.length === 0 ? (
              <p className="text-center py-8 text-gray-500 italic">No logs yet. Start by adding one above!</p>
            ) : (
              events.map(event => (
                <div key={event.id} className="flex justify-between items-center p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">
                      {event.type === 'lozenge' ? '🍬' : event.type === 'zyn' ? '📦' : '🩹'}
                    </span>
                    <div>
                      <p className="font-semibold capitalize">{event.type}</p>
                      <p className="text-xs text-gray-500">{format(event.timestamp, 'MMM dd, HH:mm')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-gray-700 dark:text-gray-300">{event.amount}mg</span>
                    <button 
                      onClick={() => removeEvent(event.id)}
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

        <footer className="text-center text-gray-500 text-xs py-4 flex items-center justify-center gap-1">
          <AlertCircle size={12} />
          Note: Cigarette equivalence is approximate (1 cig ≈ 1mg absorbed). Consult a professional for health advice.
        </footer>
      </div>
    </div>
  );
};

export default App;
