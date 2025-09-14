import React from 'react';
import { BarChart3, TrendingUp, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const AnalyticsLoading = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header Skeleton */}
      <div className="border-b bg-white">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-36" />
            </div>
          </div>
        </div>
      </div>

      <main className="p-6">
        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                {i === 0 && <DollarSign className="h-4 w-4 text-muted-foreground animate-pulse" />}
                {i === 1 && <BarChart3 className="h-4 w-4 text-muted-foreground animate-pulse" />}
                {i === 2 && <TrendingUp className="h-4 w-4 text-muted-foreground animate-pulse" />}
                {i === 3 && <DollarSign className="h-4 w-4 text-muted-foreground animate-pulse" />}
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2">
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <div className="h-[300px] bg-gray-50 rounded-lg animate-pulse flex items-center justify-center">
                <BarChart3 className="h-12 w-12 text-gray-300" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-36" />
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <div className="h-[300px] bg-gray-50 rounded-lg animate-pulse flex items-center justify-center">
                <div className="w-20 h-20 rounded-full border-4 border-gray-300 border-t-gray-400 animate-spin"></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j} className="flex justify-between items-center p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-6 w-6 rounded" />
                        <div>
                          <Skeleton className="h-4 w-24 mb-1" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>
                      <div className="text-right">
                        <Skeleton className="h-4 w-16 mb-1" />
                        <Skeleton className="h-3 w-12" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-36" />
              </CardHeader>
              <CardContent className="space-y-3">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="flex justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Loading indicator */}
        <div className="fixed bottom-4 right-4">
          <div className="bg-white rounded-lg shadow-lg border p-3 flex items-center gap-2">
            <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
            <span className="text-sm font-medium">Loading Analytics...</span>
          </div>
        </div>
      </main>
    </div>
  );
};