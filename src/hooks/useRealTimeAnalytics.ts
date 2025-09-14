import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useTenant } from './useTenant';

export interface RealTimeMetrics {
  revenue: {
    current: number;
    change: number;
    changePercent: number;
  };
  orders: {
    current: number;
    change: number;
    changePercent: number;
  };
  averageOrderValue: {
    current: number;
    change: number;
    changePercent: number;
  };
  tableUtilization: {
    current: number;
    change: number;
    changePercent: number;
  };
}

export interface ChartData {
  revenue: Array<{ time: string; value: number; }>;
  orders: Array<{ time: string; value: number; }>;
  paymentMethods: Array<{ name: string; value: number; }>;
  serviceTypes: Array<{ name: string; value: number; }>;
}

export interface AnalyticsUpdate {
  tenantId: string;
  timestamp: Date;
  metrics: RealTimeMetrics;
  chartData: ChartData;
}

export const useRealTimeAnalytics = () => {
  const { currentTenant } = useTenant();
  const [isConnected, setIsConnected] = useState(false);
  const [metrics, setMetrics] = useState<RealTimeMetrics | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!currentTenant?._id) {
      console.warn('No tenant ID available for analytics connection');
      return;
    }

    // Initialize socket connection
    const socket = io('//', {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      auth: {
        token: localStorage.getItem('token')
      }
    });

    socketRef.current = socket;

    // Connection event handlers
    socket.on('connect', () => {
      console.log('📊 Analytics WebSocket connected:', socket.id);
      setIsConnected(true);
      setError(null);
      
      // Join analytics room for this tenant
      socket.emit('join-analytics', currentTenant._id);
    });

    socket.on('disconnect', (reason) => {
      console.log('📊 Analytics WebSocket disconnected:', reason);
      setIsConnected(false);
      if (reason === 'io server disconnect') {
        socket.connect();
      }
    });

    socket.on('connect_error', (error) => {
      console.error('📊 Analytics WebSocket connection error:', error);
      setError(`Connection failed: ${error.message}`);
      setIsConnected(false);
    });

    // Analytics-specific event handlers
    socket.on('analytics-room-joined', (data: { tenantId: string; room: string }) => {
      console.log('📊 Joined analytics room:', data);
    });

    socket.on('analytics:update', (update: AnalyticsUpdate) => {
      console.log('📊 Analytics update received:', update);
      setMetrics(update.metrics);
      setChartData(update.chartData);
      setLastUpdate(new Date(update.timestamp));
    });

    socket.on('analytics:revenue', (data: { tenantId: string; timestamp: Date; data: RealTimeMetrics['revenue'] }) => {
      setMetrics(prev => prev ? { ...prev, revenue: data.data } : null);
      setLastUpdate(new Date(data.timestamp));
    });

    socket.on('analytics:orders', (data: { tenantId: string; timestamp: Date; data: RealTimeMetrics['orders'] }) => {
      setMetrics(prev => prev ? { ...prev, orders: data.data } : null);
      setLastUpdate(new Date(data.timestamp));
    });

    socket.on('analytics:charts', (data: { tenantId: string; timestamp: Date; data: ChartData }) => {
      setChartData(data.data);
      setLastUpdate(new Date(data.timestamp));
    });

    // Cleanup function
    return () => {
      if (socket.connected) {
        socket.emit('leave-analytics', currentTenant._id);
        socket.disconnect();
      }
      socketRef.current = null;
    };
  }, [currentTenant?._id]);

  // Manual reconnection function
  const reconnect = () => {
    if (socketRef.current) {
      socketRef.current.connect();
    }
  };

  // Request immediate update
  const requestUpdate = async () => {
    try {
      const response = await fetch('/api/analytics/real-time/dashboard', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to request update: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('📊 Dashboard update requested:', result);
    } catch (error) {
      console.error('📊 Error requesting dashboard update:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    }
  };

  return {
    isConnected,
    metrics,
    chartData,
    lastUpdate,
    error,
    reconnect,
    requestUpdate
  };
};