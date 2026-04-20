'use client';

import { useCrowdData } from '@/hooks/useCrowdData';
import { useState } from 'react';
import { api } from '@/lib/api';
import type { Route, RoutingResult } from '@/types';
import TopAppBar from '@/components/layout/TopAppBar';
import BottomNav from '@/components/layout/BottomNav';

const ZONE_OPTIONS = [
  { id: 'stand-north', name: 'North Stand' },
  { id: 'stand-south', name: 'South Stand' },
  { id: 'stand-east', name: 'East Stand' },
  { id: 'stand-west', name: 'West Stand' },
  { id: 'concourse-north', name: 'North Concourse' },
  { id: 'concourse-south', name: 'South Concourse' },
  { id: 'food-north', name: 'North Food Court' },
  { id: 'food-south', name: 'South Food Court' },
  { id: 'food-east', name: 'East Food Court' },
  { id: 'gate-a', name: 'Gate A (North)' },
  { id: 'gate-b', name: 'Gate B (East)' },
  { id: 'gate-c', name: 'Gate C (South)' },
  { id: 'gate-d', name: 'Gate D (West)' },
  { id: 'restroom-nw', name: 'NW Restrooms' },
  { id: 'restroom-se', name: 'SE Restrooms' },
  { id: 'vip-west', name: 'VIP Lounge' },
  { id: 'medical', name: 'Medical Center' },
];

export default function MapPage() {
  const { densityData, isConnected } = useCrowdData();
  const [fromZone, setFromZone] = useState('stand-north');
  const [toZone, setToZone] = useState('food-north');
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [loading, setLoading] = useState(false);

  const overallDensity = densityData?.overallDensity ?? 0;

  const findRoute = async () => {
    setLoading(true);
    try {
      const result = await api.findRoute(fromZone, toZone) as RoutingResult;
      setRoutes(result.routes);
      if (result.routes.length > 0) {
        const rec = result.routes.find(r => r.recommended) || result.routes[0];
        setSelectedRoute(rec);
      }
    } catch (e) {
      console.error('Route error:', e);
    } finally {
      setLoading(false);
    }
  };

  const findEmergencyRoute = async () => {
    setLoading(true);
    try {
      const result = await api.findEmergencyRoute(fromZone) as RoutingResult;
      setRoutes(result.routes);
      if (result.routes.length > 0) setSelectedRoute(result.routes[0]);
    } catch (e) {
      console.error('Emergency route error:', e);
    } finally {
      setLoading(false);
    }
  };

  const fromName = ZONE_OPTIONS.find(z => z.id === fromZone)?.name || fromZone;
  const toName = ZONE_OPTIONS.find(z => z.id === toZone)?.name || toZone;

  return (
    <div className="bg-background text-on-surface font-body min-h-dvh overflow-hidden relative">
      <TopAppBar />

      {/* Main Live Canvas */}
      <main className="relative h-dvh w-full pt-20 pb-32 overflow-hidden flex flex-col">
        {/* Stadium Map Backdrop */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-background" style={{ background: 'radial-gradient(circle at 50% 50%, #161a1f 0%, #0c0e12 100%)' }} />
          {/* Grid */}
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundSize: '40px 40px',
              backgroundImage: 'linear-gradient(to right, #434850 1px, transparent 1px), linear-gradient(to bottom, #434850 1px, transparent 1px)',
            }}
          />
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Stadium Outlines */}
            <div className="relative w-[80%] h-[60%] border-2 border-outline-variant/30 rounded-[4rem] transform -rotate-12 flex items-center justify-center">
              <div className="w-[70%] h-[70%] border border-outline-variant/20 rounded-[3rem]" />

              {/* Route Path */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" fill="none" viewBox="0 0 1000 1000">
                {selectedRoute ? (
                  <>
                    <path
                      className="drop-shadow-[0_0_15px_rgba(142,255,113,0.8)]"
                      d={`M ${selectedRoute.path.map((s, i) =>
                        `${200 + s.position.x * 6},${200 + s.position.y * 6}`
                      ).join(' L ')}`}
                      stroke="#8eff71"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="8"
                    />
                    <circle className="drop-shadow-[0_0_10px_#8eff71]" cx={200 + selectedRoute.path[0].position.x * 6} cy={200 + selectedRoute.path[0].position.y * 6} fill="#8eff71" r="10" />
                    <circle className="drop-shadow-[0_0_20px_#8eff71]" cx={200 + selectedRoute.path[selectedRoute.path.length - 1].position.x * 6} cy={200 + selectedRoute.path[selectedRoute.path.length - 1].position.y * 6} fill="#8eff71" r="14" />
                  </>
                ) : (
                  <>
                    <path
                      className="drop-shadow-[0_0_15px_rgba(142,255,113,0.8)]"
                      d="M 200,800 C 300,750 400,850 500,700 S 700,600 850,300"
                      stroke="#8eff71"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="8"
                    />
                    <circle className="drop-shadow-[0_0_10px_#8eff71]" cx="200" cy="800" fill="#8eff71" r="10" />
                    <circle className="drop-shadow-[0_0_20px_#8eff71]" cx="850" cy="300" fill="#8eff71" r="14" />
                    <circle className="opacity-80 shadow-[0_0_10px_white]" cx="450" cy="740" fill="#ffffff" r="6" />
                  </>
                )}
              </svg>

              {/* Heatmap Density Layers */}
              <div className="absolute top-1/4 left-1/4 w-48 h-48 rounded-full bg-secondary heatmap-glow" />
              <div className="absolute bottom-1/3 right-1/4 w-64 h-64 rounded-full bg-secondary heatmap-glow" />
              <div className="absolute top-1/2 right-1/2 w-40 h-40 rounded-full bg-tertiary heatmap-glow opacity-30" />
              <div className="absolute top-[20%] right-[15%] w-32 h-32 rounded-full bg-error heatmap-glow" />
            </div>
          </div>
        </div>

        {/* Real-time HUD Elements */}
        <div className="relative z-10 px-6 flex flex-col h-full pointer-events-none">
          {/* Floating Metrics */}
          <div className="flex justify-between items-start mt-4 pointer-events-auto">
            <div className="glass-panel p-5 rounded-2xl border border-primary/10 w-48">
              <p className="text-xs font-label uppercase tracking-tighter text-on-surface-variant">Arrival Point</p>
              <h2 className="text-xl font-headline font-bold text-primary mt-1">
                {selectedRoute ? toName.toUpperCase() : 'SELECT ROUTE'}
              </h2>
              <div className="mt-4 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-tertiary animate-pulse' : 'bg-error'}`} />
                <span className="text-[10px] text-tertiary font-medium">
                  {selectedRoute ? (selectedRoute.congestionLevel === 'clear' ? 'FASTEST FLOW' : selectedRoute.congestionLevel.toUpperCase()) : 'READY'}
                </span>
              </div>
            </div>
            <div className="glass-panel p-5 rounded-2xl border border-secondary/10 w-40 text-right">
              <p className="text-xs font-label uppercase tracking-tighter text-on-surface-variant">Congestion</p>
              <h2 className="text-2xl font-headline font-bold text-secondary mt-1">{overallDensity}%</h2>
              <p className="text-[10px] text-on-surface-variant mt-1 leading-tight">Live Route Optimization</p>
            </div>
          </div>

          <div className="mt-auto mb-8 pointer-events-auto">
            {/* Navigation Control Card */}
            <div className="glass-panel p-6 rounded-[2.5rem] border border-primary/10 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>navigation</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-headline font-bold leading-none">
                      {selectedRoute ? `${Math.round(selectedRoute.totalTimeSeconds / 60)} min` : 'Find Route'}
                    </h3>
                    <p className="text-sm text-on-surface-variant">
                      {selectedRoute ? 'Estimated Walk Time' : 'Select origin and destination'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] bg-tertiary/10 text-tertiary px-3 py-1 rounded-full font-bold tracking-widest border border-tertiary/20">LIVE FLOW</span>
                  {selectedRoute && (
                    <p className="text-xs text-on-surface-variant mt-2">{selectedRoute.totalDistanceMeters}m distance</p>
                  )}
                </div>
              </div>

              {/* Route Selection */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold block mb-1">From</label>
                  <select
                    value={fromZone}
                    onChange={e => setFromZone(e.target.value)}
                    className="w-full bg-surface-container-high border border-outline-variant/20 rounded-xl px-3 py-2.5 text-sm text-on-surface font-medium outline-none focus:border-primary/50"
                  >
                    {ZONE_OPTIONS.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold block mb-1">To</label>
                  <select
                    value={toZone}
                    onChange={e => setToZone(e.target.value)}
                    className="w-full bg-surface-container-high border border-outline-variant/20 rounded-xl px-3 py-2.5 text-sm text-on-surface font-medium outline-none focus:border-primary/50"
                  >
                    {ZONE_OPTIONS.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex gap-2 mb-4">
                <button
                  onClick={findRoute}
                  disabled={loading}
                  className="flex-1 py-3 bg-primary text-on-primary font-bold rounded-xl uppercase text-xs tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(143,245,255,0.2)] cursor-pointer disabled:opacity-50"
                >
                  {loading ? 'Finding...' : 'Find Route'}
                </button>
                <button
                  onClick={findEmergencyRoute}
                  disabled={loading}
                  className="py-3 px-4 bg-error/10 text-error border border-error/30 font-bold rounded-xl uppercase text-xs tracking-widest hover:bg-error/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-lg">emergency</span>
                </button>
              </div>

              {/* Route Steps */}
              {selectedRoute && (
                <div className="space-y-1">
                  {selectedRoute.path.map((step, i) => (
                    <div key={i} className="flex items-start gap-4 p-3 bg-surface-container-high rounded-2xl">
                      <span className="material-symbols-outlined text-tertiary mt-1">
                        {i === 0 ? 'my_location' : i === selectedRoute.path.length - 1 ? 'flag' : 'turn_right'}
                      </span>
                      <div>
                        <p className="text-on-surface font-medium">{step.zoneName}</p>
                        <p className="text-xs text-on-surface-variant">
                          {step.densityLevel} density • {Math.round(step.estimatedTimeSeconds / 60)} min
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Route alternatives */}
              {routes.length > 1 && (
                <div className="mt-4 flex gap-2 overflow-x-auto">
                  {routes.map(route => (
                    <button
                      key={route.id}
                      onClick={() => setSelectedRoute(route)}
                      className={`flex-shrink-0 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer ${
                        selectedRoute?.id === route.id
                          ? 'bg-primary/20 text-primary border border-primary/30'
                          : 'bg-surface-container text-on-surface-variant border border-outline-variant/10 hover:bg-surface-variant'
                      }`}
                    >
                      {route.label} • {Math.round(route.totalTimeSeconds / 60)}m
                      {route.recommended && ' ★'}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <BottomNav />

      {/* Emergency FAB */}
      <button className="fixed right-6 bottom-32 w-14 h-14 rounded-2xl bg-primary text-on-primary shadow-[0_0_20px_rgba(143,245,255,0.4)] flex items-center justify-center active:scale-95 transition-transform cursor-pointer z-[60]">
        <span className="material-symbols-outlined">emergency</span>
      </button>
    </div>
  );
}
