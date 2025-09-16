import React, { useEffect, useRef, useState, useCallback } from 'react';

interface PerformanceMetrics {
  renderTime: number;
  rerenderCount: number;
  memoryUsage?: number;
  componentName: string;
}

interface PerformanceMonitorOptions {
  componentName: string;
  enabled?: boolean;
  logToConsole?: boolean;
}

export const usePerformanceMonitor = ({
  componentName,
  enabled = process.env.NODE_ENV === 'development',
  logToConsole = true,
}: PerformanceMonitorOptions) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const renderCountRef = useRef(0);
  const lastRenderTimeRef = useRef<number>(Date.now());
  const initialRenderRef = useRef<boolean>(true);

  const startMeasure = useCallback(() => {
    if (!enabled) return;
    
    renderCountRef.current += 1;
    lastRenderTimeRef.current = performance.now();
    
    if (initialRenderRef.current) {
      performance.mark(`${componentName}-start`);
    }
  }, [componentName, enabled]);

  const endMeasure = useCallback(() => {
    if (!enabled) return;

    const renderTime = performance.now() - lastRenderTimeRef.current;
    
    if (initialRenderRef.current) {
      performance.mark(`${componentName}-end`);
      performance.measure(
        `${componentName}-render`,
        `${componentName}-start`,
        `${componentName}-end`
      );
      initialRenderRef.current = false;
    }

    const memoryUsage = (performance as any).memory?.usedJSHeapSize;

    const currentMetrics: PerformanceMetrics = {
      renderTime,
      rerenderCount: renderCountRef.current,
      memoryUsage,
      componentName,
    };

    setMetrics(currentMetrics);

    if (logToConsole) {
      const shouldLog = 
        renderCountRef.current === 1 || // First render
        renderCountRef.current % 10 === 0 || // Every 10th render
        renderTime > 16; // Slow renders (over 16ms)

      if (shouldLog) {
        console.group(`🚀 Performance Monitor: ${componentName}`);
        console.log(`📊 Render Time: ${renderTime.toFixed(2)}ms`);
        console.log(`🔄 Rerender Count: ${renderCountRef.current}`);
        if (memoryUsage) {
          console.log(`💾 Memory Usage: ${(memoryUsage / 1024 / 1024).toFixed(2)}MB`);
        }
        console.groupEnd();
      }
    }
  }, [componentName, enabled, logToConsole]);

  const getPerformanceEntry = useCallback(() => {
    if (!enabled) return null;
    
    const entries = performance.getEntriesByName(`${componentName}-render`);
    return entries.length > 0 ? entries[entries.length - 1] : null;
  }, [componentName, enabled]);

  const resetMetrics = useCallback(() => {
    renderCountRef.current = 0;
    setMetrics(null);
    performance.clearMarks(`${componentName}-start`);
    performance.clearMarks(`${componentName}-end`);
    performance.clearMeasures(`${componentName}-render`);
  }, [componentName]);

  useEffect(() => {
    startMeasure();
    return endMeasure;
  });

  return {
    metrics,
    getPerformanceEntry,
    resetMetrics,
    startMeasure,
    endMeasure,
  };
};

// Hook for measuring specific operations
export const useOperationTimer = (operationName: string) => {
  const timerRef = useRef<number>(0);

  const startTimer = useCallback(() => {
    timerRef.current = performance.now();
    performance.mark(`${operationName}-start`);
  }, [operationName]);

  const endTimer = useCallback(() => {
    const duration = performance.now() - timerRef.current;
    performance.mark(`${operationName}-end`);
    performance.measure(
      `${operationName}-duration`,
      `${operationName}-start`,
      `${operationName}-end`
    );
    
    console.log(`⏱️ ${operationName}: ${duration.toFixed(2)}ms`);
    return duration;
  }, [operationName]);

  return { startTimer, endTimer };
};

// Performance-aware component wrapper
export const withPerformanceMonitoring = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName: string
) => {
  const MonitoredComponent = (props: P) => {
    const { metrics } = usePerformanceMonitor({ 
      componentName,
      logToConsole: process.env.NODE_ENV === 'development'
    });

    return <WrappedComponent {...props} />;
  };

  MonitoredComponent.displayName = `withPerformanceMonitoring(${componentName})`;
  return MonitoredComponent;
};