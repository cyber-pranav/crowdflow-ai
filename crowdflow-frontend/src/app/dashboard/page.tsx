'use client';

import AppShell from '@/components/layout/AppShell';
import { useCrowdData } from '@/hooks/useCrowdData';
import { api } from '@/lib/api';

export default function DashboardPage() {
  const { densityData, predictions, queueData, simulationState, isConnected } = useCrowdData();

  const totalUsers = densityData?.totalUsers ?? 0;
  const overallDensity = densityData?.overallDensity ?? 0;
  const hotspots = densityData?.hotspots ?? [];

  const handleTrigger = async (event: string) => {
    try {
      await api.triggerEvent(event);
    } catch (e) {
      console.error('Trigger failed:', e);
    }
  };

  // Build timeline data from predictions
  const timelineCards = predictions.slice(0, 6).map((p, i) => ({
    time: `+${p.timeUntilMinutes}m`,
    title: p.zoneName,
    status: p.severity === 'critical' ? 'Critical Peak' : p.severity === 'warning' ? 'Density Alert' : 'Clear Flow',
    borderColor: p.severity === 'critical' ? 'border-l-error' : p.severity === 'warning' ? 'border-l-secondary' : 'border-l-tertiary',
    textColor: p.severity === 'critical' ? 'text-error' : p.severity === 'warning' ? 'text-secondary' : 'text-tertiary',
  }));

  // Fallback timeline
  const defaultTimeline = [
    { time: '21:00', title: 'Gate Exit Start', status: 'Clear Flow', borderColor: 'border-l-tertiary', textColor: 'text-tertiary' },
    { time: '21:15', title: 'Concourse Peaks', status: 'Optimal', borderColor: 'border-l-tertiary', textColor: 'text-tertiary' },
    { time: '21:30', title: 'North Gate Surge', status: 'Density Alert', borderColor: 'border-l-secondary', textColor: 'text-secondary' },
    { time: '21:45', title: 'Transit Hub Saturation', status: 'Critical Peak', borderColor: 'border-l-error', textColor: 'text-error' },
    { time: '22:00', title: 'Platform Load Bal.', status: 'Management Required', borderColor: 'border-l-secondary', textColor: 'text-secondary' },
    { time: '22:15', title: 'Dispersal Complete', status: 'Terminal State', borderColor: 'border-l-tertiary', textColor: 'text-tertiary' },
  ];

  const timeline = timelineCards.length > 0 ? timelineCards : defaultTimeline;

  return (
    <AppShell>
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
        <div>
          <h2 className="text-4xl font-bold tracking-tight text-on-surface font-headline">System Overview</h2>
          <p className="text-on-surface-variant font-label text-sm mt-2">Real-time stadium kinetics &amp; AI predictive monitoring.</p>
        </div>
        <div className="flex gap-4 flex-wrap">
          <div className="px-4 py-2 bg-surface-container-high rounded-lg border border-outline-variant/15 flex items-center gap-3">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-tertiary animate-pulse' : 'bg-error'}`} />
            <span className={`text-xs font-medium tracking-widest uppercase ${isConnected ? 'text-tertiary' : 'text-error'}`}>
              {isConnected ? 'Live System Active' : 'Disconnected'}
            </span>
          </div>
          {/* Simulation Controls */}
          <div className="flex gap-2">
            <button onClick={() => handleTrigger('halftime')} className="px-3 py-2 bg-surface-container-high rounded-lg border border-secondary/20 text-secondary text-[10px] font-bold uppercase tracking-widest hover:bg-secondary/10 transition-colors cursor-pointer">
              Halftime
            </button>
            <button onClick={() => handleTrigger('endgame')} className="px-3 py-2 bg-surface-container-high rounded-lg border border-outline-variant/20 text-on-surface-variant text-[10px] font-bold uppercase tracking-widest hover:bg-surface-variant transition-colors cursor-pointer">
              End Game
            </button>
            <button onClick={() => handleTrigger('emergency')} className="px-3 py-2 bg-surface-container-high rounded-lg border border-error/20 text-error text-[10px] font-bold uppercase tracking-widest hover:bg-error/10 transition-colors cursor-pointer">
              Emergency
            </button>
            <button onClick={() => handleTrigger('reset')} className="px-3 py-2 bg-surface-container-high rounded-lg border border-outline-variant/20 text-on-surface-variant text-[10px] font-bold uppercase tracking-widest hover:bg-surface-variant transition-colors cursor-pointer">
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Crowd Analytics Graph (Main) */}
        <div className="md:col-span-8 bg-surface-container-low rounded-3xl p-8 border border-outline-variant/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8">
            <span className="material-symbols-outlined text-primary/40 group-hover:text-primary transition-colors">insights</span>
          </div>
          <h3 className="text-xl font-bold mb-8 flex items-center gap-2 font-headline">
            <span className="material-symbols-outlined text-primary">monitoring</span>
            Crowd Density Analytics
          </h3>
          <div className="h-64 flex items-end justify-between gap-2 relative">
            {/* SVG Graph */}
            <svg className="absolute bottom-0 left-0 w-full h-full opacity-30" viewBox="0 0 1000 200">
              <defs>
                <linearGradient id="grad1" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#8ff5ff', stopOpacity: 0.2 }} />
                  <stop offset="100%" style={{ stopColor: '#8ff5ff', stopOpacity: 0 }} />
                </linearGradient>
              </defs>
              <path d="M0,150 Q100,50 200,120 T400,80 T600,140 T800,40 T1000,100" fill="none" stroke="#8ff5ff" strokeWidth="2" />
              <path d="M0,150 Q100,50 200,120 T400,80 T600,140 T800,40 T1000,100 V200 H0 Z" fill="url(#grad1)" />
            </svg>
            {/* Data bars */}
            <div className="w-full h-full flex items-end justify-around pb-4">
              {(densityData?.zones ?? []).slice(0, 6).map((zone, i) => (
                <div
                  key={zone.zoneId}
                  className="w-1 rounded-full transition-all duration-500"
                  style={{
                    height: `${Math.max(20, zone.occupancyPercent)}%`,
                    background: i === 3 ? '#ebb2ff' : 'rgba(143,245,255,0.2)',
                    boxShadow: i === 3 ? '0 0 15px rgba(235,178,255,0.4)' : 'none',
                  }}
                />
              ))}
              {(!densityData || densityData.zones.length === 0) && [50, 75, 65, 100, 80, 70].map((h, i) => (
                <div
                  key={i}
                  className="w-1 rounded-full"
                  style={{
                    height: `${h}%`,
                    background: i === 3 ? '#ebb2ff' : 'rgba(143,245,255,0.2)',
                    boxShadow: i === 3 ? '0 0 15px rgba(235,178,255,0.4)' : 'none',
                  }}
                />
              ))}
            </div>
          </div>
          <div className="mt-8 flex justify-between items-center text-xs text-on-surface-variant font-label">
            <span>Pre-Game</span>
            <span>Kick-off</span>
            <span>Half-time</span>
            <span className="text-secondary font-bold">Current</span>
          </div>
        </div>

        {/* Capacity Pulse (Small) */}
        <div className="md:col-span-4 bg-surface-container-highest rounded-3xl p-8 flex flex-col justify-between border border-primary/10">
          <div>
            <p className="text-xs uppercase tracking-widest text-on-surface-variant font-bold mb-1">Total Attendance</p>
            <h4 className="text-6xl font-headline font-bold text-primary">
              {totalUsers > 1000 ? `${(totalUsers / 1000).toFixed(1)}k` : totalUsers}
            </h4>
            <p className="text-tertiary text-sm mt-2 flex items-center gap-1 font-medium">
              <span className="material-symbols-outlined text-sm">trending_up</span>
              {simulationState ? `Phase: ${simulationState.eventPhase}` : 'Connecting...'}
            </p>
          </div>
          <div className="mt-8 pt-8 border-t border-outline-variant/10">
            <p className="text-xs uppercase tracking-widest text-on-surface-variant font-bold mb-4">Venue Saturation</p>
            <div className="w-full h-4 bg-surface-container-low rounded-full overflow-hidden p-1">
              <div
                className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-500"
                style={{ width: `${Math.min(overallDensity, 100)}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-[10px] uppercase font-bold text-on-surface-variant">
              <span>Optimal</span>
              <span className="text-on-surface">{overallDensity}%</span>
              <span>Critical</span>
            </div>
          </div>
        </div>

        {/* Predictive Timeline */}
        <div className="md:col-span-12 bg-surface-container-low rounded-3xl p-8 border border-outline-variant/10">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-bold flex items-center gap-2 font-headline">
              <span className="material-symbols-outlined text-secondary">psychology</span>
              Predictive Flow Timeline
            </h3>
            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-surface-variant text-on-surface-variant border border-outline-variant/10">
              {predictions.length > 0 ? `${predictions.length} Forecasts` : '60m Forecast'}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {timeline.map((card, i) => (
              <div
                key={i}
                className={`p-4 rounded-2xl bg-surface-container-high border-l-4 ${card.borderColor} transition-transform hover:scale-105 duration-300`}
              >
                <p className="text-[10px] uppercase font-bold text-on-surface-variant mb-1">{card.time}</p>
                <p className="text-sm font-semibold text-on-surface">{card.title}</p>
                <p className={`text-xs font-medium ${card.textColor}`}>{card.status}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Resource Allocation */}
        <div className="md:col-span-5 bg-surface-container-low rounded-3xl p-8 border border-outline-variant/10 overflow-hidden relative">
          <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-primary/5 rounded-full blur-3xl" />
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2 font-headline">
            <span className="material-symbols-outlined text-primary">engineering</span>
            Smart Allocation
          </h3>
          <div className="space-y-4 relative z-10">
            <div className="flex items-center justify-between p-4 bg-surface-container-highest rounded-xl border border-outline-variant/10">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-secondary">groups</span>
                <div>
                  <p className="text-sm font-bold">Steward Team B</p>
                  <p className="text-[10px] text-on-surface-variant uppercase">Current: North Stand</p>
                </div>
              </div>
              <button className="px-3 py-1 bg-primary text-on-primary rounded-lg text-[10px] font-bold uppercase cursor-pointer hover:brightness-110 transition-all">
                Re-route
              </button>
            </div>
            <div className="flex items-center justify-between p-4 bg-surface-container-highest rounded-xl border border-outline-variant/10">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-tertiary">airport_shuttle</span>
                <div>
                  <p className="text-sm font-bold">Transit Shuttle 04</p>
                  <p className="text-[10px] text-on-surface-variant uppercase">Current: Depot</p>
                </div>
              </div>
              <button className="px-3 py-1 bg-surface-container-low text-primary border border-primary/30 rounded-lg text-[10px] font-bold uppercase cursor-pointer hover:bg-primary/10 transition-all">
                Deploy
              </button>
            </div>
          </div>
        </div>

        {/* Heatmap Visualization */}
        <div className="md:col-span-7 bg-surface-container-low rounded-3xl p-8 border border-outline-variant/10 relative min-h-[300px] overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xl font-bold flex items-center gap-2 font-headline">
              <span className="material-symbols-outlined text-primary">stadium</span>
              Live Heat Distribution
            </h3>
            <div className="text-right">
              <p className="text-[10px] text-on-surface-variant uppercase font-bold">
                {hotspots[0] || 'All Sectors'}
              </p>
              <p className={`font-headline font-bold ${overallDensity > 60 ? 'text-error' : overallDensity > 40 ? 'text-secondary' : 'text-tertiary'}`}>
                {overallDensity > 60 ? 'HIGH DENSITY' : overallDensity > 40 ? 'MODERATE' : 'NORMAL'}
              </p>
            </div>
          </div>
          <div className="absolute inset-0 top-24 left-0 w-full h-full p-8 opacity-60">
            <div className="relative w-full h-full bg-surface-container-highest rounded-2xl border border-outline-variant/20 overflow-hidden">
              {/* Grid overlay */}
              <div
                className="absolute inset-0 opacity-30 pointer-events-none"
                style={{
                  backgroundSize: '30px 30px',
                  backgroundImage: 'linear-gradient(to right, #434850 1px, transparent 1px), linear-gradient(to bottom, #434850 1px, transparent 1px)',
                }}
              />
              {/* Pulse Effects */}
              <div className="absolute top-1/4 left-1/3 w-32 h-32 bg-secondary/30 rounded-full blur-3xl animate-pulse" />
              <div className="absolute bottom-1/3 right-1/4 w-40 h-40 bg-error/20 rounded-full blur-3xl" />
              <div className="absolute top-1/2 left-1/2 w-16 h-16 bg-primary/40 rounded-full blur-2xl" />
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
