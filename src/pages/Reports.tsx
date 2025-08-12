import { useState } from 'react';
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Checkbox } from "@/components/ui/checkbox";
import { useAnalytics } from "@/hooks/useAnalytics";
import { 
  Download, 
  FileText, 
  BarChart3, 
  PieChart, 
  Calendar,
  Clock,
  DollarSign,
  Users,
  ShoppingCart
} from "lucide-react";
import { DateRange } from "react-day-picker";

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  icon: any;
  type: 'sales' | 'customer' | 'operational' | 'financial';
  fields: string[];
}

const Reports = () => {
  const navigate = useNavigate();
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf');
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: analytics } = useAnalytics();

  const reportTemplates: ReportTemplate[] = [
    {
      id: 'daily-sales',
      name: 'Daily Sales Report',
      description: 'Complete overview of daily sales performance',
      icon: DollarSign,
      type: 'sales',
      fields: ['Revenue', 'Orders Count', 'Average Order Value', 'Peak Hours', 'Popular Items']
    },
    {
      id: 'customer-analytics',
      name: 'Customer Analytics',
      description: 'Customer behavior and satisfaction metrics',
      icon: Users,
      type: 'customer',
      fields: ['Customer Count', 'Repeat Customers', 'Satisfaction Score', 'Demographics']
    },
    {
      id: 'operational-summary',
      name: 'Operational Summary',
      description: 'Restaurant operations and efficiency report',
      icon: Clock,
      type: 'operational',
      fields: ['Table Utilization', 'Service Times', 'Staff Performance', 'Order Processing']
    },
    {
      id: 'financial-overview',
      name: 'Financial Overview',
      description: 'Comprehensive financial performance analysis',
      icon: BarChart3,
      type: 'financial',
      fields: ['Revenue by Service', 'Cost Analysis', 'Profit Margins', 'Growth Metrics']
    },
    {
      id: 'inventory-report',
      name: 'Inventory Report',
      description: 'Stock levels and usage patterns',
      icon: ShoppingCart,
      type: 'operational',
      fields: ['Stock Levels', 'Usage Patterns', 'Reorder Alerts', 'Waste Analysis']
    },
    {
      id: 'custom-report',
      name: 'Custom Report',
      description: 'Build your own report with selected metrics',
      icon: FileText,
      type: 'sales',
      fields: ['Revenue', 'Orders', 'Customers', 'Tables', 'Staff', 'Inventory', 'Satisfaction']
    }
  ];

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = reportTemplates.find(t => t.id === templateId);
    if (template) {
      setSelectedFields(template.fields);
    }
  };

  const handleFieldToggle = (field: string) => {
    setSelectedFields(prev => 
      prev.includes(field) 
        ? prev.filter(f => f !== field)
        : [...prev, field]
    );
  };

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    
    // Simulate report generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // In a real implementation, this would call an API to generate the report
    const template = reportTemplates.find(t => t.id === selectedTemplate);
    const fileName = `${template?.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.${selectedFormat}`;
    
    // Create a simple data structure for download
    const reportData = {
      template: template?.name,
      dateRange: dateRange ? `${dateRange.from?.toDateString()} - ${dateRange.to?.toDateString()}` : 'All time',
      format: selectedFormat,
      fields: selectedFields,
      generatedAt: new Date().toISOString(),
      data: analytics
    };
    
    // Create and download file
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    setIsGenerating(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="p-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Reports Generator</h1>
            <p className="text-muted-foreground">
              Generate comprehensive reports for your restaurant operations
            </p>
          </div>
          
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={() => navigate("/analytics")}
          >
            <BarChart3 className="h-4 w-4" />
            View Analytics
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Report Templates */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Report Templates</CardTitle>
                <CardDescription>Choose from pre-built report templates or create a custom report</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reportTemplates.map((template) => (
                    <div
                      key={template.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                        selectedTemplate === template.id 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => handleTemplateSelect(template.id)}
                    >
                      <div className="flex items-start gap-3">
                        <template.icon className="h-5 w-5 text-primary mt-1" />
                        <div className="flex-1">
                          <h3 className="font-medium mb-1">{template.name}</h3>
                          <p className="text-sm text-muted-foreground mb-2">{template.description}</p>
                          <div className="flex flex-wrap gap-1">
                            {template.fields.slice(0, 3).map((field) => (
                              <span key={field} className="text-xs bg-secondary px-2 py-1 rounded">
                                {field}
                              </span>
                            ))}
                            {template.fields.length > 3 && (
                              <span className="text-xs text-muted-foreground">
                                +{template.fields.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Custom Fields Selection */}
            {selectedTemplate === 'custom-report' && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Select Report Fields</CardTitle>
                  <CardDescription>Choose the metrics you want to include in your custom report</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {reportTemplates.find(t => t.id === 'custom-report')?.fields.map((field) => (
                      <div key={field} className="flex items-center space-x-2">
                        <Checkbox
                          id={field}
                          checked={selectedFields.includes(field)}
                          onCheckedChange={() => handleFieldToggle(field)}
                        />
                        <Label htmlFor={field} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          {field}
                        </Label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Report Configuration */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Report Configuration</CardTitle>
                <CardDescription>Configure your report settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Date Range */}
                <div className="space-y-2">
                  <Label>Date Range</Label>
                  <DatePickerWithRange
                    date={dateRange}
                    onDateChange={setDateRange}
                    className="w-full"
                  />
                </div>

                {/* Format Selection */}
                <div className="space-y-2">
                  <Label>Export Format</Label>
                  <Select value={selectedFormat} onValueChange={(value: 'pdf' | 'excel' | 'csv') => setSelectedFormat(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF Document</SelectItem>
                      <SelectItem value="excel">Excel Spreadsheet</SelectItem>
                      <SelectItem value="csv">CSV File</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Selected Fields Preview */}
                {selectedTemplate && (
                  <div className="space-y-2">
                    <Label>Included Fields ({selectedFields.length})</Label>
                    <div className="max-h-32 overflow-y-auto">
                      <div className="space-y-1">
                        {selectedFields.map((field) => (
                          <div key={field} className="flex items-center justify-between text-sm p-2 bg-secondary rounded">
                            <span>{field}</span>
                            <Checkbox 
                              checked 
                              onCheckedChange={() => handleFieldToggle(field)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Generate Button */}
                <Button 
                  className="w-full" 
                  onClick={handleGenerateReport}
                  disabled={!selectedTemplate || selectedFields.length === 0 || isGenerating}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isGenerating ? 'Generating...' : 'Generate Report'}
                </Button>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Today's Revenue</span>
                  <span className="text-sm font-medium">${analytics?.totalRevenue.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Orders</span>
                  <span className="text-sm font-medium">{analytics?.totalOrders || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Avg Order Value</span>
                  <span className="text-sm font-medium">${analytics?.averageOrderValue.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Customer Satisfaction</span>
                  <span className="text-sm font-medium">{analytics?.customerSatisfaction || 0}/5</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Reports */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Recent Reports</CardTitle>
            <CardDescription>Previously generated reports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: 'Daily Sales Report - Jan 15', type: 'PDF', size: '2.1 MB', date: '2 hours ago' },
                { name: 'Customer Analytics - Jan 14', type: 'Excel', size: '1.8 MB', date: '1 day ago' },
                { name: 'Operational Summary - Jan 13', type: 'CSV', size: '0.5 MB', date: '2 days ago' },
              ].map((report, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{report.name}</p>
                      <p className="text-sm text-muted-foreground">{report.type} • {report.size}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{report.date}</span>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Reports;