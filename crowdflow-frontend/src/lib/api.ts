const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `API error: ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Crowd density
  getDensity: () => fetchAPI('/crowd/density'),
  getHeatmap: () => fetchAPI('/crowd/heatmap'),
  getZoneDensity: (zoneId: string) => fetchAPI(`/crowd/zone/${zoneId}`),
  getHotspots: () => fetchAPI('/crowd/hotspots'),
  getStadiumState: () => fetchAPI('/crowd/stadium'),

  // Routing
  findRoute: (from: string, to: string) => fetchAPI(`/route/find?from=${from}&to=${to}`),
  findEmergencyRoute: (from: string) => fetchAPI(`/route/emergency?from=${from}`),

  // Queue
  getQueueRankings: (userZone?: string, type?: string) => {
    const params = new URLSearchParams();
    if (userZone) params.set('userZone', userZone);
    if (type) params.set('type', type);
    return fetchAPI(`/queue/rankings?${params}`);
  },
  getAllQueues: () => fetchAPI('/queue/all'),

  // AI Assistant
  chat: (message: string, userZoneId?: string) =>
    fetchAPI('/assistant/chat', {
      method: 'POST',
      body: JSON.stringify({ message, userZoneId }),
    }),

  // Simulation
  startSimulation: (userCount = 500, tickInterval = 2000) =>
    fetchAPI('/simulation/start', {
      method: 'POST',
      body: JSON.stringify({ userCount, tickInterval }),
    }),
  stopSimulation: () => fetchAPI('/simulation/stop', { method: 'POST' }),
  triggerEvent: (event: string) => fetchAPI(`/simulation/trigger/${event}`, { method: 'POST' }),
  getSimulationState: () => fetchAPI('/simulation/state'),
  getPredictions: () => fetchAPI('/simulation/predictions'),

  // Health
  health: () => fetchAPI('/health'),
};
