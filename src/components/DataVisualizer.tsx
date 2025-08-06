import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BarChart3, PieChart as PieChartIcon, TrendingUp, Table as TableIcon, Download, Eye } from "lucide-react";

interface Dataset {
  id: string;
  name: string;
  description: string | null;
  columns?: string[];
  sample_data?: any[];
  row_count?: number;
}

interface ChartData {
  name: string;
  value: number;
}

export function DataVisualizer({ selectedDatasetId }: { selectedDatasetId?: string | null }) {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [chartType, setChartType] = useState<"bar" | "line" | "pie">("bar");
  const [xAxis, setXAxis] = useState<string>("");
  const [yAxis, setYAxis] = useState<string>("");
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadDatasets();
  }, []);

  // Auto-select dataset if selectedDatasetId changes
  useEffect(() => {
    if (selectedDatasetId && datasets.length > 0) {
      const found = datasets.find(d => d.id === selectedDatasetId);
      if (found) setSelectedDataset(found);
    }
  }, [selectedDatasetId, datasets]);

  useEffect(() => {
    if (selectedDataset && xAxis && yAxis) {
      generateChartData();
    }
  }, [selectedDataset, xAxis, yAxis]);

  const loadDatasets = async () => {
    try {
      const { data, error } = await supabase
        .from('datasets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDatasets(data || []);
    } catch (error) {
      console.error('Error loading datasets:', error);
      toast({
        title: "Error",
        description: "Failed to load datasets",
        variant: "destructive",
      });
    }
  };

  const generateChartData = () => {
    if (!selectedDataset?.sample_data || !xAxis || !yAxis) return;

    const data = selectedDataset.sample_data.map((row: any) => ({
      name: row[xAxis] || 'Unknown',
      value: parseFloat(row[yAxis]) || 0,
    }));

    setChartData(data);
  };

  const handleDatasetSelect = (datasetId: string) => {
    const dataset = datasets.find(d => d.id === datasetId);
    setSelectedDataset(dataset || null);
    setXAxis("");
    setYAxis("");
    setChartData([]);
  };

  const getChartComponent = () => {
    if (!chartData.length) return null;

    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1'];

    switch (chartType) {
      case "bar":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        );
      case "line":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        );
      case "pie":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );
      default:
        return null;
    }
  };

  const exportChart = () => {
    // Implementation for exporting chart as image
    toast({
      title: "Export",
      description: "Chart export feature coming soon!",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Data Visualizer</h2>
          <p className="text-muted-foreground">Create charts and visualizations from your datasets</p>
        </div>
        {selectedDataset && (
          <Button onClick={exportChart}>
            <Download className="h-4 w-4 mr-2" />
            Export Chart
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Controls Panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Chart Settings</CardTitle>
            <CardDescription>Configure your visualization</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Dataset</label>
              <Select onValueChange={handleDatasetSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a dataset" />
                </SelectTrigger>
                <SelectContent>
                  {datasets.map((dataset) => (
                    <SelectItem key={dataset.id} value={dataset.id}>
                      {dataset.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedDataset && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Chart Type</label>
                  <Select value={chartType} onValueChange={(value: "bar" | "line" | "pie") => setChartType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bar">
                        <div className="flex items-center gap-2">
                          <BarChart3 className="h-4 w-4" />
                          Bar Chart
                        </div>
                      </SelectItem>
                      <SelectItem value="line">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          Line Chart
                        </div>
                      </SelectItem>
                      <SelectItem value="pie">
                        <div className="flex items-center gap-2">
                          <PieChartIcon className="h-4 w-4" />
                          Pie Chart
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">X-Axis (Category)</label>
                  <Select value={xAxis} onValueChange={setXAxis}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select X-axis column" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedDataset.columns?.map((column) => (
                        <SelectItem key={column} value={column}>
                          {column}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Y-Axis (Value)</label>
                  <Select value={yAxis} onValueChange={setYAxis}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Y-axis column" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedDataset.columns?.map((column) => (
                        <SelectItem key={column} value={column}>
                          {column}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedDataset && (
                  <div className="p-4 border rounded-lg bg-muted/50">
                    <h4 className="font-medium mb-2">Dataset Info</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Rows:</span>
                        <span>{selectedDataset.row_count?.toLocaleString() || 'Unknown'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Columns:</span>
                        <span>{selectedDataset.columns?.length || 0}</span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Chart Display */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Visualization</CardTitle>
            <CardDescription>
              {selectedDataset ? `Charting data from ${selectedDataset.name}` : "Select a dataset to create a chart"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedDataset ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mb-4 opacity-50" />
                <p>Select a dataset to start visualizing your data</p>
              </div>
            ) : !xAxis || !yAxis ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Eye className="h-12 w-12 mb-4 opacity-50" />
                <p>Select X and Y axes to generate the chart</p>
              </div>
            ) : (
              <div className="space-y-4">
                {getChartComponent()}
                
                {/* Data Table */}
                <Tabs defaultValue="chart" className="w-full">
                  <TabsList>
                    <TabsTrigger value="chart">Chart</TabsTrigger>
                    <TabsTrigger value="data">Data</TabsTrigger>
                  </TabsList>
                  <TabsContent value="data" className="mt-4">
                    <div className="border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Value</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {chartData.map((row, index) => (
                            <TableRow key={index}>
                              <TableCell>{row.name}</TableCell>
                              <TableCell>{row.value}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 