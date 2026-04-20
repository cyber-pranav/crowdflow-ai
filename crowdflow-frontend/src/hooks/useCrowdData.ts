'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { HeatmapData, PredictionAlert, QueueUpdate, SimulationState } from '@/types';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

interface CrowdFlowData {
  densityData: HeatmapData | null;
  predictions: PredictionAlert[];
  queueData: QueueUpdate[];
  simulationState: SimulationState | null;
  isConnected: boolean;
  socket: Socket | null;
}

export function useCrowdData(): CrowdFlowData {
  const [densityData, setDensityData] = useState<HeatmapData | null>(null);
  const [predictions, setPredictions] = useState<PredictionAlert[]>([]);
  const [queueData, setQueueData] = useState<QueueUpdate[]>([]);
  const [simulationState, setSimulationState] = useState<SimulationState | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('🔌 Connected to CrowdFlow');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('🔌 Disconnected');
    });

    // Real-time data streams
    socket.on('density:update', (data: HeatmapData) => {
      setDensityData(data);
    });

    socket.on('prediction:alert', (data: PredictionAlert[]) => {
      setPredictions(data);
    });

    socket.on('queue:update', (data: QueueUpdate[]) => {
      setQueueData(data);
    });

    socket.on('simulation:tick', (data: SimulationState) => {
      setSimulationState(data);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return {
    densityData,
    predictions,
    queueData,
    simulationState,
    isConnected,
    socket: socketRef.current,
  };
}
