import React from 'react';
import { Package, AlertTriangle, Clock, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const InventoryLoading = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-4 w-80" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[Package, AlertTriangle, Clock, DollarSign].map((Icon, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-32" />
                <Icon className="h-4 w-4 text-muted-foreground animate-pulse" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Tabs */}
        <Card>
          <CardContent className="p-0">
            <Tabs value="ingredients">
              <div className="border-b">
                <TabsList className="w-full justify-start rounded-none h-auto p-0 bg-transparent">
                  {['Ingredients', 'Recipes', 'Suppliers', 'Purchase Orders', 'Reports'].map((tab, i) => (
                    <TabsTrigger 
                      key={i}
                      value={tab.toLowerCase()}
                      className="rounded-none border-b-2 border-transparent px-6 py-3"
                    >
                      <Skeleton className="h-4 w-16" />
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              {/* Ingredients Tab Content */}
              <TabsContent value="ingredients" className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex gap-2">
                    <Skeleton className="h-9 w-72" />
                    <Skeleton className="h-9 w-44" />
                  </div>
                  <Skeleton className="h-9 w-36" />
                </div>

                {/* Table Loading */}
                <div className="rounded-md border">
                  <div className="p-4 border-b bg-gray-50">
                    <div className="grid grid-cols-9 gap-4">
                      {['Name', 'Category', 'Stock', 'Levels', 'Cost', 'Value', 'Location', 'Status', 'Actions'].map((header, i) => (
                        <Skeleton key={i} className="h-4 w-full" />
                      ))}
                    </div>
                  </div>
                  
                  {/* Table rows */}
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="p-4 border-b last:border-b-0">
                      <div className="grid grid-cols-9 gap-4 items-center">
                        <div>
                          <Skeleton className="h-4 w-24 mb-1" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                        <Skeleton className="h-5 w-16 rounded-full" />
                        <Skeleton className="h-4 w-12" />
                        <div className="space-y-1">
                          <Skeleton className="h-3 w-full" />
                          <Skeleton className="h-3 w-full" />
                        </div>
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-5 w-14 rounded-full" />
                        <div className="flex gap-1">
                          <Skeleton className="h-7 w-7" />
                          <Skeleton className="h-7 w-7" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Loading indicator */}
        <div className="fixed bottom-4 right-4">
          <div className="bg-white rounded-lg shadow-lg border p-3 flex items-center gap-2">
            <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
            <span className="text-sm font-medium">Loading Inventory...</span>
          </div>
        </div>
      </div>
    </div>
  );
};