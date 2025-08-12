import { useState } from 'react';
import { Clock, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Order } from '@/types/order.types';

interface PrepTimeEstimatorProps {
  orders: Order[];
}

interface PrepTimeStats {
  averageTime: number;
  shortestTime: number;
  longestTime: number;
  onTimeRate: number;
  totalOrders: number;
}

interface MenuItemPerformance {
  name: string;
  avgPrepTime: number;
  estimatedTime: number;
  orders: number;
  efficiency: number;
}

export function PrepTimeEstimator({ orders }: PrepTimeEstimatorProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'today' | 'week' | 'month'>('today');

  const getTimeframedOrders = (orders: Order[], timeframe: string): Order[] => {
    const now = new Date();
    const cutoff = new Date();
    
    switch (timeframe) {
      case 'today':
        cutoff.setHours(0, 0, 0, 0);
        break;
      case 'week':
        cutoff.setDate(now.getDate() - 7);
        break;
      case 'month':
        cutoff.setMonth(now.getMonth() - 1);
        break;
    }
    
    return orders.filter(order => new Date(order.createdAt) >= cutoff);
  };

  const calculatePrepTimeStats = (orders: Order[]): PrepTimeStats => {
    const completedOrders = orders.filter(o => 
      o.status === 'completed' && o.completedAt && o.createdAt
    );

    if (completedOrders.length === 0) {
      return {
        averageTime: 0,
        shortestTime: 0,
        longestTime: 0,
        onTimeRate: 0,
        totalOrders: 0
      };
    }

    const prepTimes = completedOrders.map(order => {
      const created = new Date(order.createdAt).getTime();
      const completed = new Date(order.completedAt!).getTime();
      return (completed - created) / (1000 * 60); // minutes
    });

    const estimatedTimes = completedOrders.map(order => {
      return Math.max(...order.items.map(item => 
        typeof item.menuItem === 'object' ? item.menuItem.preparationTime : 15
      ));
    });

    const onTimeOrders = completedOrders.filter((order, index) => 
      prepTimes[index] <= estimatedTimes[index] * 1.2 // 20% tolerance
    );

    return {
      averageTime: Math.round(prepTimes.reduce((sum, time) => sum + time, 0) / prepTimes.length),
      shortestTime: Math.round(Math.min(...prepTimes)),
      longestTime: Math.round(Math.max(...prepTimes)),
      onTimeRate: Math.round((onTimeOrders.length / completedOrders.length) * 100),
      totalOrders: completedOrders.length
    };
  };

  const calculateMenuItemPerformance = (orders: Order[]): MenuItemPerformance[] => {
    const itemStats = new Map<string, {
      name: string;
      prepTimes: number[];
      estimatedTime: number;
      orders: number;
    }>();

    orders.filter(o => o.status === 'completed' && o.completedAt).forEach(order => {
      const orderPrepTime = (new Date(order.completedAt!).getTime() - new Date(order.createdAt).getTime()) / (1000 * 60);
      
      order.items.forEach(item => {
        const itemName = typeof item.menuItem === 'object' ? item.menuItem.name : 'Unknown Item';
        const estimatedTime = typeof item.menuItem === 'object' ? item.menuItem.preparationTime : 15;
        
        if (!itemStats.has(itemName)) {
          itemStats.set(itemName, {
            name: itemName,
            prepTimes: [],
            estimatedTime,
            orders: 0
          });
        }
        
        const stats = itemStats.get(itemName)!;
        stats.prepTimes.push(orderPrepTime / order.items.length); // Distribute time across items
        stats.orders++;
      });
    });

    return Array.from(itemStats.entries()).map(([_, stats]) => {
      const avgPrepTime = stats.prepTimes.reduce((sum, time) => sum + time, 0) / stats.prepTimes.length;
      const efficiency = Math.round((stats.estimatedTime / avgPrepTime) * 100);
      
      return {
        name: stats.name,
        avgPrepTime: Math.round(avgPrepTime),
        estimatedTime: stats.estimatedTime,
        orders: stats.orders,
        efficiency: Math.min(efficiency, 150) // Cap at 150% for display
      };
    }).sort((a, b) => b.orders - a.orders).slice(0, 10);
  };

  const getCurrentLoad = (orders: Order[]): number => {
    const activeOrders = orders.filter(o => 
      ['pending', 'confirmed', 'preparing'].includes(o.status)
    );
    
    // Simple load calculation based on active orders and estimated prep times
    const totalEstimatedTime = activeOrders.reduce((sum, order) => {
      const maxPrepTime = Math.max(...order.items.map(item => 
        typeof item.menuItem === 'object' ? item.menuItem.preparationTime : 15
      ));
      return sum + maxPrepTime;
    }, 0);
    
    // Assume kitchen capacity of 120 minutes of concurrent work
    return Math.min(Math.round((totalEstimatedTime / 120) * 100), 100);
  };

  const timeframedOrders = getTimeframedOrders(orders, selectedTimeframe);
  const stats = calculatePrepTimeStats(timeframedOrders);
  const menuPerformance = calculateMenuItemPerformance(timeframedOrders);
  const currentLoad = getCurrentLoad(orders);

  const getLoadColor = (load: number): string => {
    if (load >= 80) return 'text-red-600';
    if (load >= 60) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getEfficiencyColor = (efficiency: number): string => {
    if (efficiency >= 100) return 'text-green-600';
    if (efficiency >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Current Kitchen Load
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getLoadColor(currentLoad)}`}>
              {currentLoad}%
            </div>
            <Progress value={currentLoad} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {currentLoad >= 80 ? 'High load' : currentLoad >= 60 ? 'Moderate load' : 'Normal load'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Average Prep Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageTime}m</div>
            <p className="text-xs text-muted-foreground mt-1">
              Based on {stats.totalOrders} completed orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">On-Time Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getEfficiencyColor(stats.onTimeRate)}`}>
              {stats.onTimeRate}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Within estimated time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Time Range</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              <div>Fastest: {stats.shortestTime}m</div>
              <div>Slowest: {stats.longestTime}m</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTimeframe} onValueChange={(v) => setSelectedTimeframe(v as any)}>
        <TabsList>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="week">This Week</TabsTrigger>
          <TabsTrigger value="month">This Month</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTimeframe} className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Menu Item Performance</CardTitle>
              <CardDescription>
                Preparation time analysis for popular menu items
              </CardDescription>
            </CardHeader>
            <CardContent>
              {menuPerformance.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-8 w-8 mx-auto mb-2" />
                  <p>No completed orders in this timeframe</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {menuPerformance.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.name}</span>
                          <Badge variant="outline">{item.orders} orders</Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span>Estimated: {item.estimatedTime}m</span>
                          <span>Actual: {item.avgPrepTime}m</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-semibold ${getEfficiencyColor(item.efficiency)}`}>
                          {item.efficiency}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {item.efficiency >= 100 ? 'On target' : 
                           item.efficiency >= 80 ? 'Slightly slow' : 'Needs attention'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {currentLoad >= 80 && (
        <Card className="border-yellow-500 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <p className="font-medium text-yellow-800">High Kitchen Load Alert</p>
            </div>
            <p className="text-sm text-yellow-700 mt-1">
              Consider informing new customers of longer wait times or temporarily marking slow-prep items as unavailable.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}