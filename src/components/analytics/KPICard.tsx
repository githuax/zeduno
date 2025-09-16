import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface KPICardProps {
  title: string;
  value: number;
  change: number;
  changePercent: number;
  formatValue?: (value: number) => string;
  icon?: React.ReactNode;
  color?: 'default' | 'green' | 'red' | 'blue' | 'purple';
}

const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  change,
  changePercent,
  formatValue = (v) => v.toLocaleString(),
  icon,
  color = 'default'
}) => {
  const getTrendIcon = () => {
    if (Math.abs(changePercent) < 0.1) {
      return <Minus className="h-4 w-4 text-gray-400" />;
    }
    return changePercent > 0
      ? <TrendingUp className="h-4 w-4 text-green-500" />
      : <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  const getTrendColor = () => {
    if (Math.abs(changePercent) < 0.1) return 'text-gray-500';
    return changePercent > 0 ? 'text-green-600' : 'text-red-600';
  };

  const getCardColorClass = () => {
    switch (color) {
      case 'green': return 'border-green-200 bg-green-50';
      case 'red': return 'border-red-200 bg-red-50';
      case 'blue': return 'border-blue-200 bg-blue-50';
      case 'purple': return 'border-purple-200 bg-purple-50';
      default: return 'border-gray-200';
    }
  };

  const formatChangePercent = (percent: number) => {
    if (Math.abs(percent) < 0.1) return '0.0%';
    const sign = percent >= 0 ? '+' : '';
    return `${sign}${percent.toFixed(1)}%`;
  };

  return (
    <Card className={`transition-all duration-200 hover:shadow-md ${getCardColorClass()}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && (
          <div className="h-4 w-4 text-muted-foreground">
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-1">
          <div className="text-2xl font-bold">
            {formatValue(value)}
          </div>
          <div className="flex items-center space-x-2 text-sm">
            {getTrendIcon()}
            <span className={getTrendColor()}>
              {formatChangePercent(changePercent)} from last period
            </span>
          </div>
          {Math.abs(change) > 0.01 && (
            <div className="text-xs text-muted-foreground">
              {change >= 0 ? '+' : ''}{formatValue(change)} change
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default KPICard;

