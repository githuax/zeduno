import { CronJob } from 'cron';
import { AnalyticsService } from './analytics.service';
import { websocketService, AnalyticsUpdate } from './websocket.service';
import { ReportFilters } from '../types/report.types';

export interface CachedMetrics {
  tenantId: string;
  timestamp: Date;
  revenue: number;
  orders: number;
  averageOrderValue: number;
  tableUtilization: number;
  chartData: {
    revenue: Array<{ time: string; value: number; }>;
    orders: Array<{ time: string; value: number; }>;
    paymentMethods: Array<{ name: string; value: number; }>;
    serviceTypes: Array<{ name: string; value: number; }>;
  };
}

export class RealTimeAnalyticsService {
  private static instance: RealTimeAnalyticsService;
  private analyticsService: AnalyticsService;
  private cronJob: CronJob | null = null;
  private previousMetrics: Map<string, CachedMetrics> = new Map();
  private isRunning = false;

  private constructor() {
    this.analyticsService = AnalyticsService.getInstance();
  }

  public static getInstance(): RealTimeAnalyticsService {
    if (!RealTimeAnalyticsService.instance) {
      RealTimeAnalyticsService.instance = new RealTimeAnalyticsService();
    }
    return RealTimeAnalyticsService.instance;
  }

  /**
   * Initialize real-time analytics with scheduled updates every 30 seconds
   */
  public initialize(): void {
    if (this.isRunning) {
      console.log('📊 Real-time analytics already running');
      return;
    }

    // Run every 30 seconds: '*/30 * * * * *'
    this.cronJob = new CronJob('*/30 * * * * *', async () => {
      await this.updateAllTenantMetrics();
    }, null, false, 'UTC');

    this.cronJob.start();
    this.isRunning = true;
    
    console.log('📊 Real-time analytics service initialized - updating every 30 seconds');
  }

  /**
   * Stop the real-time analytics service
   */
  public stop(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
    }
    this.isRunning = false;
    console.log('📊 Real-time analytics service stopped');
  }

  /**
   * Update metrics for all active tenants
   */
  private async updateAllTenantMetrics(): Promise<void> {
    try {
      const activeTenants = await this.getActiveTenants();
      
      for (const tenantId of activeTenants) {
        // Only update if there are connected clients
        const connectionCount = websocketService.getAnalyticsConnectionCount(tenantId);
        if (connectionCount > 0) {
          await this.updateTenantMetrics(tenantId);
        }
      }
    } catch (error) {
      console.error('❌ Error updating tenant metrics:', error);
    }
  }

  /**
   * Update real-time metrics for a specific tenant
   */
  private async updateTenantMetrics(tenantId: string): Promise<void> {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Create filter objects for analytics queries
      const currentHourFilters = {
        startDate: oneHourAgo,
        endDate: now,
        tenantId,
        branchId: undefined
      };
      
      const dayFilters = {
        startDate: oneDayAgo,
        endDate: now,
        tenantId,
        branchId: undefined
      };

      // Fetch analytics data
      const [
        salesAnalytics,
        daySalesAnalytics
      ] = await Promise.all([
        this.analyticsService.generateSalesAnalytics(currentHourFilters),
        this.analyticsService.generateSalesAnalytics(dayFilters)
      ]);

      // Extract metrics from analytics data
      const currentRevenue = salesAnalytics.summary?.totalRevenue || 0;
      const currentOrders = salesAnalytics.summary?.totalOrders || 0;
      const tableUtilization = Math.random() * 100; // TODO: Implement proper table utilization

      const averageOrderValue = currentOrders > 0 ? currentRevenue / currentOrders : 0;

      // Get previous metrics for comparison
      const previousData = this.previousMetrics.get(tenantId);
      
      // Calculate changes
      const revenueChange = previousData 
        ? currentRevenue - previousData.revenue 
        : 0;
      const ordersChange = previousData 
        ? currentOrders - previousData.orders 
        : 0;
      const aovChange = previousData 
        ? averageOrderValue - previousData.averageOrderValue 
        : 0;
      const utilizationChange = previousData 
        ? tableUtilization - previousData.tableUtilization 
        : 0;

      // Calculate percentage changes (avoid division by zero)
      const revenueChangePercent = previousData?.revenue 
        ? (revenueChange / previousData.revenue) * 100 
        : 0;
      const ordersChangePercent = previousData?.orders 
        ? (ordersChange / previousData.orders) * 100 
        : 0;
      const aovChangePercent = previousData?.averageOrderValue 
        ? (aovChange / previousData.averageOrderValue) * 100 
        : 0;
      const utilizationChangePercent = previousData?.tableUtilization 
        ? (utilizationChange / previousData.tableUtilization) * 100 
        : 0;

      // Create analytics update
      const analyticsUpdate: AnalyticsUpdate = {
        tenantId,
        timestamp: now,
        metrics: {
          revenue: {
            current: currentRevenue,
            change: revenueChange,
            changePercent: revenueChangePercent
          },
          orders: {
            current: currentOrders,
            change: ordersChange,
            changePercent: ordersChangePercent
          },
          averageOrderValue: {
            current: averageOrderValue,
            change: aovChange,
            changePercent: aovChangePercent
          },
          tableUtilization: {
            current: tableUtilization,
            change: utilizationChange,
            changePercent: utilizationChangePercent
          }
        },
        chartData: {
          revenue: daySalesAnalytics.topPerformingHours?.map(item => ({
            time: this.formatTime(item.hour),
            value: item.revenue
          })) || [],
          orders: daySalesAnalytics.topPerformingHours?.map(item => ({
            time: this.formatTime(item.hour),
            value: item.orders
          })) || [],
          paymentMethods: daySalesAnalytics.byPaymentMethod?.map(item => ({
            name: item.paymentMethod || 'Unknown',
            value: item.totalRevenue
          })) || [],
          serviceTypes: daySalesAnalytics.byOrderType?.map(item => ({
            name: item.orderType || 'Unknown',
            value: item.orders
          })) || [
            { name: 'Dine-in', value: 0 },
            { name: 'Takeaway', value: 0 },
            { name: 'Delivery', value: 0 }
          ]
        }
      };

      // Cache current metrics for next comparison
      this.previousMetrics.set(tenantId, {
        tenantId,
        timestamp: now,
        revenue: currentRevenue,
        orders: currentOrders,
        averageOrderValue,
        tableUtilization,
        chartData: analyticsUpdate.chartData
      });

      // Emit the update via WebSocket
      websocketService.emitAnalyticsUpdate(analyticsUpdate);

      console.log(`📊 Updated analytics for tenant ${tenantId}: Revenue: ${currentRevenue}, Orders: ${currentOrders}`);

    } catch (error) {
      console.error(`❌ Error updating metrics for tenant ${tenantId}:`, error);
    }
  }

  /**
   * Get list of active tenants (tenants with analytics room connections)
   */
  private async getActiveTenants(): Promise<string[]> {
    try {
      // This would ideally come from a tenant service or database query
      // For now, we'll extract tenant IDs from active analytics rooms
      const activeTenants: string[] = [];
      
      if (websocketService.isInitialized()) {
        const io = (websocketService as any).io; // Access private io property
        if (io && io.sockets.adapter.rooms) {
          for (const [roomName] of io.sockets.adapter.rooms) {
            if (roomName.startsWith('analytics:')) {
              const tenantId = roomName.replace('analytics:', '');
              activeTenants.push(tenantId);
            }
          }
        }
      }

      return [...new Set(activeTenants)]; // Remove duplicates
    } catch (error) {
      console.error('❌ Error getting active tenants:', error);
      return [];
    }
  }

  /**
   * Format time for chart display
   */
  private formatTime(hour: number | { hour: number } | string): string {
    if (typeof hour === 'string') {
      return hour;
    }
    const hourValue = typeof hour === 'number' ? hour : hour.hour;
    return `${hourValue.toString().padStart(2, '0')}:00`;
  }

  /**
   * Manually trigger update for a specific tenant (useful for testing)
   */
  public async triggerTenantUpdate(tenantId: string): Promise<void> {
    await this.updateTenantMetrics(tenantId);
  }

  /**
   * Get service status
   */
  public getStatus() {
    return {
      isRunning: this.isRunning,
      activeConnections: this.previousMetrics.size,
      lastUpdate: new Date().toISOString()
    };
  }
}

// Export singleton instance
export const realTimeAnalyticsService = RealTimeAnalyticsService.getInstance();