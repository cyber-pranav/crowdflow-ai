'use client';

import AppShell from '@/components/layout/AppShell';
import { useCrowdData } from '@/hooks/useCrowdData';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface ExitPrediction {
  gateId: string;
  gateName: string;
  currentWaitMinutes: number;
  predictedWaitMinutes: number;
  optimalDepartureMinutes: number;
  recommendation: string;
}

export default function AlertsPage() {
  const { predictions, queueData, densityData, isConnected } = useCrowdData();
  const [exitPredictions, setExitPredictions] = useState<ExitPrediction[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.getPredictions() as any;
        setExitPredictions(res.exitPredictions || []);
      } catch (e) {
        console.error(e);
      }
    };
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, []);

  const criticalAlerts = predictions.filter(p => p.severity === 'critical');
  const warningAlerts = predictions.filter(p => p.severity === 'warning');
  const infoAlerts = predictions.filter(p => p.severity === 'info');
  const fastestVendor = queueData.length > 0
    ? [...queueData].sort((a, b) => a.waitTimeSeconds - b.waitTimeSeconds)[0]
    : null;

  return (
    <AppShell>
      {/* Hero Section */}
      <section className="mb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-2 font-headline">Live Alerts</h1>
            <p className="text-on-surface-variant font-label text-sm uppercase tracking-[0.2em]">Stadium Nervous System Monitoring</p>
          </div>
          <div className="flex items-center gap-4 bg-surface-container-low p-4 rounded-xl border border-outline-variant/10">
            <div className="relative flex h-3 w-3">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isConnected ? 'bg-tertiary' : 'bg-error'} opacity-75`} />
              <span className={`relative inline-flex rounded-full h-3 w-3 ${isConnected ? 'bg-tertiary' : 'bg-error'}`} />
            </div>
            <span className="text-sm font-medium tracking-wide">{isConnected ? 'SYSTEM: ACTIVE' : 'CONNECTING...'}</span>
          </div>
        </div>
      </section>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* CRITICAL ALERT */}
        <div className="md:col-span-8 group relative overflow-hidden rounded-3xl bg-surface-container-high border border-error/20 p-8 flex flex-col justify-between min-h-[320px]">
          <div className="absolute top-0 right-0 p-8">
            <span className="material-symbols-outlined text-error text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
          </div>
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-error/10 text-error px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-6">
              {criticalAlerts.length > 0 ? 'Urgent Intervention' : 'Monitoring'}
            </div>
            <h2 className="text-3xl md:text-4xl font-bold leading-tight mb-4 text-on-surface font-headline">
              {criticalAlerts.length > 0 ? (
                <>{criticalAlerts[0].zoneName} getting crowded — <span className="text-error">redirecting you</span></>
              ) : (
                <>All zones nominal — <span className="text-tertiary">no action needed</span></>
              )}
            </h2>
            <p className="text-on-surface-variant max-w-md">
              {criticalAlerts.length > 0
                ? `AI detected a density surge. ${criticalAlerts[0].reason}. Confidence: ${Math.round(criticalAlerts[0].confidence * 100)}%`
                : 'Our AI is monitoring all zones in real-time. You\'ll be alerted immediately if congestion is detected.'}
            </p>
          </div>
          <div className="relative z-10 flex flex-wrap gap-4 mt-8">
            {criticalAlerts.length > 0 ? (
              <>
                <button className="bg-primary text-on-primary font-bold py-3 px-8 rounded-xl shadow-[0_0_20px_rgba(143,245,255,0.3)] hover:scale-105 transition-transform cursor-pointer">
                  Accept Path
                </button>
                <button className="bg-surface-variant/50 text-on-surface border border-outline-variant/20 font-bold py-3 px-8 rounded-xl backdrop-blur-sm hover:bg-surface-variant transition-colors cursor-pointer">
                  Ignore
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2 text-tertiary text-sm font-medium">
                <span className="material-symbols-outlined text-sm">check_circle</span>
                System healthy — {predictions.length} predictions being tracked
              </div>
            )}
          </div>
          <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-error/10 rounded-full blur-[80px]" />
        </div>

        {/* PREDICTIVE ALERT */}
        <div className="md:col-span-4 rounded-3xl bg-surface-container-low border border-secondary/20 p-8 flex flex-col justify-between min-h-[320px]">
          <div>
            <div className="flex justify-between items-start mb-6">
              <span className="material-symbols-outlined text-secondary text-3xl">hourglass_bottom</span>
              <span className="text-secondary font-label text-[10px] uppercase tracking-widest">Prediction</span>
            </div>
            <h3 className="text-2xl font-bold leading-tight mb-3 font-headline">
              {warningAlerts.length > 0 ? (
                <>Exit congestion predicted in <span className="text-secondary">{warningAlerts[0].timeUntilMinutes} mins</span></>
              ) : exitPredictions.length > 0 ? (
                <>Best exit: <span className="text-secondary">{exitPredictions[0]?.gateName}</span></>
              ) : (
                <>Exit predictions <span className="text-secondary">loading</span></>
              )}
            </h3>
            <p className="text-on-surface-variant text-sm">
              {warningAlerts.length > 0
                ? warningAlerts[0].reason
                : exitPredictions.length > 0
                ? exitPredictions[0].recommendation
                : 'Analyzing crowd flow patterns for optimal exit timing.'}
            </p>
          </div>
          <div className="mt-6 flex items-center gap-3 text-secondary">
            <div className="h-1 flex-1 bg-secondary-container rounded-full overflow-hidden">
              <div
                className="h-full bg-secondary transition-all duration-500"
                style={{ width: `${warningAlerts.length > 0 ? Math.round(warningAlerts[0].confidence * 100) : 75}%` }}
              />
            </div>
            <span className="text-xs font-bold">
              {warningAlerts.length > 0 ? `${Math.round(warningAlerts[0].confidence * 100)}%` : '---'} Match
            </span>
          </div>
        </div>

        {/* POSITIVE ALERT: Food Stall */}
        <div className="md:col-span-5 rounded-3xl bg-surface-container-low border border-tertiary/20 p-8 flex flex-col min-h-[260px] justify-between">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-tertiary/10 rounded-2xl flex items-center justify-center">
              <span className="material-symbols-outlined text-tertiary text-2xl">restaurant</span>
            </div>
            <div>
              <p className="text-tertiary font-label text-[10px] uppercase tracking-[0.2em]">Opportunity</p>
              <h3 className="text-xl font-bold font-headline">
                {fastestVendor
                  ? `${fastestVendor.vendorName} — ${Math.round(fastestVendor.waitTimeSeconds / 60)}m wait`
                  : 'Finding best food option...'}
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-xs text-on-surface-variant">
              {fastestVendor
                ? `Only ${fastestVendor.queueLength} people in queue. ${fastestVendor.trend === 'growing' ? 'Queue growing — hurry!' : 'Queue is stable.'}`
                : 'Loading vendor data...'}
            </p>
          </div>
          <a
            href="/queues"
            className="w-full mt-6 py-2 border-b border-tertiary/30 text-tertiary text-sm font-bold uppercase tracking-widest hover:border-tertiary transition-all text-center block"
          >
            View All Queues
          </a>
        </div>

        {/* ACTIVITY FEED */}
        <div className="md:col-span-7 rounded-3xl bg-surface-container-high p-8 flex flex-col gap-6">
          <h4 className="text-sm font-label uppercase tracking-widest text-on-surface-variant mb-2">History &amp; Predictions</h4>

          {/* Feed from predictions */}
          {predictions.length > 0 ? (
            predictions.slice(0, 6).map((alert, i) => (
              <div key={alert.id} className="flex items-start gap-4 p-4 rounded-2xl bg-surface-container hover:bg-surface-variant transition-colors cursor-pointer">
                <span className={`material-symbols-outlined mt-1 ${alert.severity === 'critical' ? 'text-error' : alert.severity === 'warning' ? 'text-secondary' : 'text-primary'}`}>
                  {alert.severity === 'critical' ? 'error' : alert.severity === 'warning' ? 'warning' : 'info'}
                </span>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-on-surface font-bold">{alert.zoneName}</span>
                    <span className="text-[10px] text-on-surface-variant font-medium">In {alert.timeUntilMinutes} min</span>
                  </div>
                  <p className="text-sm text-on-surface-variant">{alert.reason}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-1 flex-1 bg-surface-variant rounded-full overflow-hidden max-w-[120px]">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${alert.confidence * 100}%`,
                          background: alert.severity === 'critical' ? '#ff716c' : alert.severity === 'warning' ? '#ebb2ff' : '#8ff5ff',
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-on-surface-variant">{Math.round(alert.confidence * 100)}%</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <>
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-surface-container">
                <span className="material-symbols-outlined text-primary mt-1">info</span>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-on-surface font-bold">System Monitoring</span>
                    <span className="text-[10px] text-on-surface-variant font-medium">NOW</span>
                  </div>
                  <p className="text-sm text-on-surface-variant">All zones nominal. AI is analyzing crowd patterns in real-time.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-surface-container">
                <span className="material-symbols-outlined text-secondary mt-1">navigation</span>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-on-surface font-bold">Route Optimization</span>
                    <span className="text-[10px] text-on-surface-variant font-medium">ACTIVE</span>
                  </div>
                  <p className="text-sm text-on-surface-variant">Smart routing engine is ready. Paths will update based on live density.</p>
                </div>
              </div>
            </>
          )}

          {/* Exit predictions */}
          {exitPredictions.length > 0 && (
            <>
              <h4 className="text-sm font-label uppercase tracking-widest text-on-surface-variant mt-4">Exit Predictions</h4>
              {exitPredictions.slice(0, 3).map(ep => (
                <div key={ep.gateId} className="flex items-start gap-4 p-4 rounded-2xl bg-surface-container">
                  <span className="material-symbols-outlined text-tertiary mt-1">door_front</span>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-on-surface font-bold">{ep.gateName}</span>
                      <span className={`text-xs font-bold ${ep.currentWaitMinutes < 5 ? 'text-tertiary' : ep.currentWaitMinutes < 10 ? 'text-secondary' : 'text-error'}`}>
                        {ep.currentWaitMinutes}m wait
                      </span>
                    </div>
                    <p className="text-sm text-on-surface-variant">{ep.recommendation}</p>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
