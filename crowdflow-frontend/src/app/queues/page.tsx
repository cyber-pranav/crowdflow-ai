'use client';

import AppShell from '@/components/layout/AppShell';
import { useCrowdData } from '@/hooks/useCrowdData';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import type { VendorRanking } from '@/types';

export default function QueuesPage() {
  const { isConnected, densityData, queueData } = useCrowdData();
  const [rankings, setRankings] = useState<VendorRanking[]>([]);
  const [loading, setLoading] = useState(false);

  const overallDensity = densityData?.overallDensity ?? 0;

  const loadRankings = async () => {
    setLoading(true);
    try {
      const res = await api.getQueueRankings() as any;
      setRankings(res.rankings);
    } catch (e) {
      console.error('Failed to load rankings:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRankings();
    const interval = setInterval(loadRankings, 10000);
    return () => clearInterval(interval);
  }, []);

  const recommended = rankings.find(r => r.recommended);
  const otherVendors = rankings.filter(r => !r.recommended).slice(0, 3);

  // Gate data from queue data
  const gateData = [
    { name: 'Gate A: VIP Entrance', security: 'Normal', time: '2 MIN', color: 'primary', borderColor: 'border-l-primary' },
    { name: 'Gate C: Main Concourse', security: 'Congested', time: '22 MIN', color: 'secondary', borderColor: 'border-l-secondary' },
  ];

  // Washroom data
  const washrooms = [
    { name: 'Sector 4-B', status: 'Empty', location: 'Adjacent to Section 102', color: 'tertiary' },
    { name: 'Sector 9-G', status: 'Busy (8 Min)', location: 'Near Concessions East', color: 'secondary' },
  ];

  return (
    <AppShell>
      {/* Hero Section */}
      <section className="mb-12 relative overflow-hidden rounded-3xl p-8 bg-surface-container-low border border-outline-variant/10">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-primary/10 rounded-full blur-[100px]" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-end gap-8">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-6xl font-headline font-bold text-on-background tracking-tighter leading-none mb-4">
              OPTIMIZE YOUR <span className="text-primary italic">STADIUM FLOW</span>
            </h1>
            <p className="text-on-surface-variant font-body max-w-md">
              AI-powered predictive queueing. Real-time bottleneck detection for the ultimate fan experience.
            </p>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[0.65rem] uppercase tracking-[0.2em] text-tertiary font-bold mb-1">Global Crowd Density</span>
            <div className="flex items-center gap-2">
              <div className="h-2 w-32 bg-surface-container-highest rounded-full overflow-hidden">
                <div
                  className="h-full bg-tertiary shadow-[0_0_10px_rgba(142,255,113,0.5)] transition-all duration-500"
                  style={{ width: `${overallDensity}%` }}
                />
              </div>
              <span className="text-xl font-headline font-medium text-tertiary">{overallDensity}%</span>
            </div>
          </div>
        </div>
      </section>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Food & Beverage: Large Feature */}
        <div className="md:col-span-8 space-y-6">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-2xl font-headline font-bold text-on-surface uppercase tracking-wider">Food &amp; Beverage</h2>
            <span className="text-xs font-label text-outline uppercase tracking-widest">
              {rankings.length > 0 ? `${rankings.filter(r => r.vendor.isOpen).length} Vendors Active` : 'Loading...'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Recommended Stall */}
            <div className="glass-panel-strong neon-border-tertiary rounded-2xl p-5 relative overflow-hidden group">
              <div className="absolute top-4 right-4 bg-tertiary/20 text-tertiary text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-tighter flex items-center gap-1 border border-tertiary/30">
                <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                Best Option
              </div>
              <div className="flex flex-col h-full justify-between">
                <div>
                  <div className="text-on-surface-variant text-xs font-medium uppercase mb-1">
                    {recommended?.vendor.zoneId || 'Loading...'}
                  </div>
                  <h3 className="text-xl font-headline font-bold text-on-surface mb-4">
                    {recommended?.vendor.name || 'Finding best option...'}
                  </h3>
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                      <span className="text-2xl font-headline font-bold text-tertiary">
                        {recommended ? `${recommended.waitTimeMinutes} MIN` : '---'}
                      </span>
                      <span className="text-[10px] text-outline uppercase">Wait Time</span>
                    </div>
                    <div className="w-[1px] h-8 bg-outline-variant/30" />
                    <div className="flex flex-col">
                      <span className="text-2xl font-headline font-bold text-on-surface">
                        {recommended?.vendor.queueLength ?? '---'}
                      </span>
                      <span className="text-[10px] text-outline uppercase">In Queue</span>
                    </div>
                  </div>
                </div>
                <button className="mt-6 w-full py-3 bg-tertiary text-on-tertiary font-bold rounded-xl uppercase text-xs tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(142,255,113,0.2)] cursor-pointer">
                  Join Virtual Queue
                </button>
              </div>
            </div>

            {/* Other Stalls */}
            {otherVendors.slice(0, 1).map((r) => (
              <div key={r.vendor.id} className="glass-panel-strong rounded-2xl p-5 border-outline-variant/20 hover:bg-surface-variant transition-colors">
                <div className="flex flex-col h-full justify-between">
                  <div>
                    <div className="text-on-surface-variant text-xs font-medium uppercase mb-1">
                      {r.vendor.zoneId}
                    </div>
                    <h3 className="text-xl font-headline font-bold text-on-surface mb-4">{r.vendor.name}</h3>
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col">
                        <span className={`text-2xl font-headline font-bold ${r.waitTimeMinutes < 5 ? 'text-tertiary' : r.waitTimeMinutes < 10 ? 'text-primary' : 'text-secondary'}`}>
                          {r.waitTimeMinutes} MIN
                        </span>
                        <span className="text-[10px] text-outline uppercase">Wait Time</span>
                      </div>
                      <div className="w-[1px] h-8 bg-outline-variant/30" />
                      <div className="flex flex-col">
                        <span className="text-2xl font-headline font-bold text-on-surface">{r.vendor.queueLength}</span>
                        <span className="text-[10px] text-outline uppercase">In Queue</span>
                      </div>
                    </div>
                  </div>
                  <button className="mt-6 w-full py-3 bg-surface-container-highest text-primary font-bold rounded-xl border border-primary/20 uppercase text-xs tracking-widest hover:bg-primary/10 transition-all cursor-pointer">
                    Join Virtual Queue
                  </button>
                </div>
              </div>
            ))}

            {/* Fallback if no data */}
            {rankings.length === 0 && (
              <div className="glass-panel-strong rounded-2xl p-5 flex items-center justify-center">
                <p className="text-on-surface-variant text-sm">Loading vendor data...</p>
              </div>
            )}
          </div>

          {/* Stadium Access */}
          <div className="mt-12">
            <h2 className="text-2xl font-headline font-bold text-on-surface uppercase tracking-wider mb-6">Stadium Access</h2>
            <div className="space-y-4">
              {gateData.map((gate, i) => (
                <div key={i} className={`glass-panel-strong p-4 rounded-xl flex items-center justify-between border-l-4 ${gate.borderColor}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg bg-${gate.color}/10 flex items-center justify-center`}>
                      <span className={`material-symbols-outlined text-${gate.color}`}>door_front</span>
                    </div>
                    <div>
                      <h4 className="font-headline font-bold text-on-surface">{gate.name}</h4>
                      <p className="text-[10px] text-outline uppercase">Security Check: {gate.security}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-headline font-bold text-${gate.color}`}>{gate.time}</div>
                    <div className="text-[10px] text-outline uppercase">Clearance Time</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Washrooms & Sidebar */}
        <div className="md:col-span-4 space-y-6">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-headline font-bold text-on-surface uppercase tracking-wider">Washrooms</h2>
            <span className="material-symbols-outlined text-on-surface-variant text-sm">info</span>
          </div>

          <div className="space-y-3">
            {washrooms.map((wr, i) => (
              <div key={i} className="bg-surface-container-low p-4 rounded-2xl flex items-center gap-4">
                <div className="relative">
                  <div className={`w-10 h-10 rounded-full bg-${wr.color}/10 flex items-center justify-center`}>
                    <span className={`material-symbols-outlined text-${wr.color}`}>wc</span>
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-${wr.color} border-2 border-background`} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-on-surface font-headline">{wr.name}</span>
                    <span className={`text-${wr.color} text-xs font-bold uppercase tracking-tight`}>{wr.status}</span>
                  </div>
                  <span className="text-[10px] text-outline uppercase">{wr.location}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Map Card */}
          <div className="relative h-64 rounded-3xl overflow-hidden mt-8 bg-surface-container-low border border-outline-variant/10">
            <div
              className="absolute inset-0 opacity-30 pointer-events-none"
              style={{
                backgroundSize: '30px 30px',
                backgroundImage: 'linear-gradient(to right, #434850 1px, transparent 1px), linear-gradient(to bottom, #434850 1px, transparent 1px)',
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <a
                href="/map"
                className="w-full py-3 glass-panel-strong text-primary font-bold rounded-xl text-xs uppercase tracking-[0.2em] hover:bg-primary hover:text-on-primary transition-all flex items-center justify-center"
              >
                View Heatmap
              </a>
            </div>
          </div>

          {/* Live AI Alert */}
          <div className="p-6 rounded-3xl bg-secondary-container/20 border border-secondary/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-20">
              <span className="material-symbols-outlined text-4xl text-secondary">psychology</span>
            </div>
            <div className="text-secondary text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-secondary" /> Live Insight
            </div>
            <p className="text-sm font-medium text-secondary-fixed mb-4">
              {queueData.length > 0
                ? `${queueData.filter(q => q.trend === 'growing').length} vendors seeing growing queues. Consider alternatives.`
                : 'Monitoring queue patterns. Data loading...'}
            </p>
            <div className="flex items-center justify-between text-[10px] text-on-secondary-container uppercase font-bold">
              <span>Confidence: 94%</span>
              <span className="underline underline-offset-4 cursor-pointer">Learn More</span>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
