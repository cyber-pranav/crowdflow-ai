'use client';

import AppShell from '@/components/layout/AppShell';
import { useCrowdData } from '@/hooks/useCrowdData';
import { useState } from 'react';
import { api } from '@/lib/api';
import type { ChatMessage, AssistantResponse } from '@/types';

export default function HomePage() {
  const { densityData, predictions, queueData, isConnected } = useCrowdData();
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: '👋 Hi! I\'m CrowdFlow AI. Ask me anything about the stadium — crowds, food, exits, or routes!',
      timestamp: Date.now(),
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  const totalUsers = densityData?.totalUsers ?? 0;
  const overallDensity = densityData?.overallDensity ?? 0;
  const hotspots = densityData?.hotspots ?? [];

  // Find fastest food vendor from queue data
  const fastestVendor = queueData.length > 0
    ? [...queueData].sort((a, b) => a.waitTimeSeconds - b.waitTimeSeconds)[0]
    : null;

  // Find best prediction info
  const criticalPredictions = predictions.filter(p => p.severity === 'critical');
  const warningPredictions = predictions.filter(p => p.severity === 'warning');

  const sendChat = async (text: string) => {
    if (!text.trim() || chatLoading) return;
    const userMsg: ChatMessage = { role: 'user', content: text.trim(), timestamp: Date.now() };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);
    try {
      const res = await api.chat(text.trim()) as AssistantResponse;
      setChatMessages(prev => [...prev, { role: 'assistant', content: res.message, timestamp: Date.now() }]);
    } catch {
      setChatMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Connection error. Is the backend running?', timestamp: Date.now() }]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <AppShell>
      {/* Personalized Greeting */}
      <section className="mb-10">
        <p className="font-headline text-secondary text-sm font-medium tracking-[0.2em] uppercase mb-2">
          Live Status
        </p>
        <h2 className="font-headline text-4xl md:text-5xl font-bold tracking-tight text-on-surface">
          Your Stadium Assistant
        </h2>
        <div className="mt-4 flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isConnected ? 'bg-tertiary' : 'bg-error'} opacity-75`} />
            <span className={`relative inline-flex rounded-full h-3 w-3 ${isConnected ? 'bg-tertiary' : 'bg-error'}`} />
          </span>
          <p className="text-on-surface-variant font-body text-sm">
            {isConnected ? `System operational • ${totalUsers.toLocaleString()} active fans tracked` : 'Connecting to backend...'}
          </p>
        </div>
      </section>

      {/* Main Content Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Centerpiece: Live Crowd Heatmap */}
        <div className="md:col-span-8 group relative overflow-hidden rounded-3xl bg-surface-container-low border border-outline-variant/10 neon-glow-primary">
          <div className="absolute top-6 left-6 z-10">
            <div className="flex items-center gap-2 bg-background/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-primary/20">
              <span className="material-symbols-outlined text-primary text-sm">stadium</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Main Arena Heatmap</span>
            </div>
          </div>

          {/* Heatmap Canvas */}
          <div className="relative aspect-[16/10] md:aspect-auto md:h-[500px] w-full bg-surface-container-lowest overflow-hidden">
            {/* Grid background */}
            <div
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                backgroundSize: '40px 40px',
                backgroundImage: 'linear-gradient(to right, #434850 1px, transparent 1px), linear-gradient(to bottom, #434850 1px, transparent 1px)',
              }}
            />
            {/* Heatmap Blobs */}
            <div className="absolute inset-0 heatmap-gradient" />
            {/* Dynamic Pulse Points */}
            {hotspots.length > 0 && (
              <div className="absolute top-[30%] left-[45%] flex flex-col items-center">
                <div className="w-4 h-4 rounded-full bg-error animate-ping absolute" />
                <div className="w-4 h-4 rounded-full bg-error relative" />
                <div className="mt-2 bg-error-container/80 backdrop-blur-sm text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                  Bottleneck
                </div>
              </div>
            )}
            <div className="absolute bottom-[25%] right-[20%] flex flex-col items-center">
              <div className="w-4 h-4 rounded-full bg-tertiary animate-ping absolute" />
              <div className="w-4 h-4 rounded-full bg-tertiary relative" />
              <div className="mt-2 bg-tertiary-container/80 backdrop-blur-sm text-[10px] font-bold px-2 py-0.5 rounded uppercase text-on-tertiary-container">
                Optimal Flow
              </div>
            </div>
          </div>

          {/* Heatmap Footer */}
          <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-background to-transparent flex justify-between items-end">
            <div className="space-y-1">
              <p className="text-on-surface-variant text-xs uppercase tracking-widest font-medium">Current Peak Zone</p>
              <p className="font-headline text-2xl font-bold text-on-surface">
                {hotspots[0] || 'All Clear'}
              </p>
            </div>
            <div className="flex items-center gap-2 bg-background/60 backdrop-blur-md px-4 py-2 rounded-xl border border-primary/20">
              <span className="text-xs text-on-surface-variant uppercase tracking-widest">Density</span>
              <span className={`font-headline text-xl font-bold ${overallDensity > 60 ? 'text-error' : overallDensity > 40 ? 'text-secondary' : 'text-tertiary'}`}>
                {overallDensity}%
              </span>
            </div>
          </div>
        </div>

        {/* Side Cards Column */}
        <div className="md:col-span-4 flex flex-col gap-6">
          {/* Fastest Food Zone */}
          <div className="flex-1 p-6 rounded-3xl bg-surface-container-high border border-outline-variant/10 relative overflow-hidden group hover:border-primary/30 transition-colors">
            <div className="absolute -right-4 -top-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-[80px] text-tertiary">restaurant</span>
            </div>
            <div className="flex flex-col h-full justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-tertiary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-tertiary">speed</span>
                  </div>
                  <h3 className="text-on-surface-variant font-medium text-xs uppercase tracking-[0.1em]">Fastest Food Zone</h3>
                </div>
                <div>
                  <h4 className="font-headline text-2xl font-bold text-on-surface">
                    {fastestVendor?.vendorName || 'Loading...'}
                  </h4>
                  <p className="text-tertiary font-bold text-sm flex items-center gap-1 mt-1">
                    <span className="material-symbols-outlined text-sm">schedule</span>
                    {fastestVendor ? `${Math.round(fastestVendor.waitTimeSeconds / 60)} min wait` : '---'}
                  </p>
                </div>
              </div>
              <div className="mt-6">
                <div className="h-1.5 w-full bg-surface-variant rounded-full overflow-hidden">
                  <div
                    className="h-full bg-tertiary rounded-full transition-all duration-500"
                    style={{ width: `${fastestVendor ? Math.max(10, 100 - (fastestVendor.waitTimeSeconds / 600) * 100) : 0}%` }}
                  />
                </div>
                <p className="text-[10px] text-on-surface-variant mt-2 uppercase tracking-widest font-bold">
                  Queue: {fastestVendor?.queueLength ?? '---'} people
                </p>
              </div>
            </div>
          </div>

          {/* Active Alerts */}
          <div className="flex-1 p-6 rounded-3xl bg-surface-container-high border border-outline-variant/10 relative overflow-hidden group hover:border-primary/30 transition-colors">
            <div className="absolute -right-4 -top-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-[80px] text-secondary">notifications_active</span>
            </div>
            <div className="flex flex-col h-full justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-secondary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-secondary">warning</span>
                  </div>
                  <h3 className="text-on-surface-variant font-medium text-xs uppercase tracking-[0.1em]">Active Alerts</h3>
                </div>
                <div>
                  <h4 className="font-headline text-2xl font-bold text-on-surface">
                    {criticalPredictions.length > 0 ? `${criticalPredictions.length} Critical` : warningPredictions.length > 0 ? `${warningPredictions.length} Warning` : 'All Clear'}
                  </h4>
                  <p className={`font-bold text-sm flex items-center gap-1 mt-1 ${criticalPredictions.length > 0 ? 'text-error' : warningPredictions.length > 0 ? 'text-secondary' : 'text-tertiary'}`}>
                    <span className="material-symbols-outlined text-sm">
                      {criticalPredictions.length > 0 ? 'error' : 'check_circle'}
                    </span>
                    {predictions.length} total predictions
                  </p>
                </div>
              </div>
              <a
                href="/alerts"
                className="w-full mt-6 py-3 border border-outline-variant/30 rounded-xl text-[10px] font-bold uppercase tracking-widest text-on-surface hover:bg-surface-variant transition-colors flex items-center justify-center gap-2"
              >
                View All Alerts
              </a>
            </div>
          </div>

          {/* Estimated Exit Time */}
          <div className="flex-1 p-6 rounded-3xl bg-surface-container-high border border-outline-variant/10 bg-gradient-to-br from-surface-container-high to-background relative overflow-hidden">
            <div className="flex flex-col h-full justify-between gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-on-surface-variant font-medium text-xs uppercase tracking-[0.1em]">Est. Exit Time</h3>
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>timer</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-headline text-5xl font-extrabold text-primary">
                  {overallDensity > 60 ? '18' : overallDensity > 40 ? '12' : '6'}
                </span>
                <span className="font-headline text-xl font-bold text-on-surface-variant">MIN</span>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                AI prediction based on current crowd density and your location.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* AI Predictive Flow Insights */}
      <section className="mt-12">
        <h3 className="font-headline text-xl font-bold mb-6 flex items-center gap-2">
          <span className="w-8 h-[1px] bg-primary" />
          AI Predictive Flow Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface-container-low p-5 rounded-2xl border border-outline-variant/5">
            <p className="text-[10px] uppercase font-bold tracking-widest text-on-surface-variant mb-2">Peak Prediction</p>
            <p className="text-on-surface font-medium">
              {predictions.length > 0
                ? `${predictions[0]?.zoneName} predicted to reach ${predictions[0]?.predictedDensity} in ${predictions[0]?.timeUntilMinutes} mins.`
                : 'No congestion predicted. All zones looking good.'}
            </p>
          </div>
          <div className="bg-surface-container-low p-5 rounded-2xl border border-outline-variant/5">
            <p className="text-[10px] uppercase font-bold tracking-widest text-on-surface-variant mb-2">Queue Intelligence</p>
            <p className="text-on-surface font-medium">
              {queueData.length > 0
                ? `${queueData.filter(q => q.waitTimeSeconds < 180).length} vendors with under 3 min wait.`
                : 'Loading vendor data...'}
            </p>
          </div>
          <div className="bg-surface-container-low p-5 rounded-2xl border border-outline-variant/5">
            <p className="text-[10px] uppercase font-bold tracking-widest text-on-surface-variant mb-2">Safety Update</p>
            <p className="text-on-surface font-medium">
              {hotspots.length > 0
                ? `AI monitoring ${hotspots.length} hotspot zone${hotspots.length > 1 ? 's' : ''} for dense gathering.`
                : 'All zones clear. No safety concerns detected.'}
            </p>
          </div>
        </div>
      </section>

      {/* Floating AI Assistant Button */}
      <div className="fixed bottom-28 right-8 z-[110]">
        <div className="relative group">
          <div className="absolute inset-0 bg-primary rounded-full animate-ping opacity-20 scale-150" />
          <button
            onClick={() => setShowChat(!showChat)}
            className="relative w-16 h-16 bg-background border-2 border-primary/50 rounded-full flex flex-col items-center justify-center shadow-[0_0_30px_rgba(143,245,255,0.4)] hover:scale-110 transition-transform duration-300 cursor-pointer"
          >
            <span className="material-symbols-outlined text-primary text-2xl">psychology</span>
            <div className="voice-wave">
              <span className="animate-pulse" style={{ height: 8 }} />
              <span className="animate-pulse" style={{ height: 16, animationDelay: '0.2s' }} />
              <span className="animate-pulse" style={{ height: 12, animationDelay: '0.4s' }} />
              <span className="animate-pulse" style={{ height: 20, animationDelay: '0.6s' }} />
            </div>
          </button>
          <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-primary text-on-primary-container px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest whitespace-nowrap shadow-xl pointer-events-none">
            How can I help?
          </div>
        </div>
      </div>

      {/* Chat Modal */}
      {showChat && (
        <div className="fixed bottom-28 right-8 z-[120] w-[360px] max-h-[500px] bg-surface-container-high rounded-3xl border border-primary/20 shadow-[0_20px_60px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden">
          <div className="p-4 border-b border-outline-variant/10 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <span className="material-symbols-outlined text-on-primary text-lg">smart_toy</span>
            </div>
            <div className="flex-1">
              <div className="font-headline font-bold text-sm">AI Assistant</div>
              <div className="text-[10px] text-on-surface-variant">Powered by Gemini • Live data</div>
            </div>
            <button onClick={() => setShowChat(false)} className="material-symbols-outlined text-on-surface-variant hover:text-on-surface cursor-pointer">close</button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[320px]">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.role === 'user'
                ? 'ml-auto bg-primary text-on-primary rounded-br-sm'
                : 'bg-surface-container rounded-bl-sm border border-outline-variant/10'
              }`}>
                {msg.content}
              </div>
            ))}
            {chatLoading && (
              <div className="flex gap-1 p-3">
                <div className="w-2 h-2 rounded-full bg-on-surface-variant animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-on-surface-variant animate-bounce" style={{ animationDelay: '0.2s' }} />
                <div className="w-2 h-2 rounded-full bg-on-surface-variant animate-bounce" style={{ animationDelay: '0.4s' }} />
              </div>
            )}
          </div>
          <div className="p-3 border-t border-outline-variant/10 flex gap-2">
            <input
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendChat(chatInput)}
              placeholder="Ask anything..."
              className="flex-1 bg-surface-container border border-outline-variant/20 rounded-full px-4 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none focus:border-primary/50"
            />
            <button
              onClick={() => sendChat(chatInput)}
              disabled={chatLoading || !chatInput.trim()}
              className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center disabled:opacity-50 cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">send</span>
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
