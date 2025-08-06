import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Database, Edit, Trash2, Upload, FileText, BarChart3, Eye, Download } from "lucide-react";

interface Dataset {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  file_path?: string;
  file_size?: number;
  row_count?: number;
  columns?: string[];
  sample_data?: any[];
}

interface FileUpload {
  file: File;
  progress: number;
  status: 'uploading' | 'processing' | 'complete' | 'error';
}

export function DatasetManager({ onAnalyzeDataset }: { onAnalyzeDataset?: (datasetId: string) => void }) {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDataset, setEditingDataset] = useState<Dataset | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activeTab, setActiveTab] = useState("overview");
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedDatasetForPreview, setSelectedDatasetForPreview] = useState<Dataset | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadDatasets();
  }, []);

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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['text/csv', 'application/json', 'text/plain'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please upload a CSV, JSON, or text file",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const processFileData = async (file: File): Promise<{ columns: string[], sampleData: any[], rowCount: number }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          let columns: string[] = [];
          let sampleData: any[] = [];
          let rowCount = 0;

          if (file.type === 'text/csv') {
            const lines = content.split('\n');
            if (lines.length > 0) {
              columns = lines[0].split(',').map(col => col.trim().replace(/"/g, ''));
              sampleData = lines.slice(1, 6).map(line => {
                const values = line.split(',').map(val => val.trim().replace(/"/g, ''));
                const row: any = {};
                columns.forEach((col, index) => {
                  row[col] = values[index] || '';
                });
                return row;
              }).filter(row => Object.values(row).some(val => val !== ''));
              rowCount = lines.length - 1;
            }
          } else if (file.type === 'application/json') {
            const data = JSON.parse(content);
            if (Array.isArray(data)) {
              if (data.length > 0) {
                columns = Object.keys(data[0]);
                sampleData = data.slice(0, 5);
                rowCount = data.length;
              }
            } else {
              columns = Object.keys(data);
              sampleData = [data];
              rowCount = 1;
            }
          }

          resolve({ columns, sampleData, rowCount });
        } catch (error) {
          reject(error);
        }
      };
      reader.readAsText(file);
    });
  };

  const uploadFile = async (file: File): Promise<string> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user found');

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('datasets')
      .upload(fileName, file);

    if (error) throw error;
    return data.path;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setUploadProgress(0);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      let filePath: string | undefined;
      let fileSize: number | undefined;
      let columns: string[] | undefined;
      let sampleData: any[] | undefined;
      let rowCount: number | undefined;

      if (selectedFile) {
        setUploadProgress(20);
        
        // Upload file
        filePath = await uploadFile(selectedFile);
        setUploadProgress(60);
        
        // Process file data
        const processedData = await processFileData(selectedFile);
        columns = processedData.columns;
        sampleData = processedData.sampleData;
        rowCount = processedData.rowCount;
        fileSize = selectedFile.size;
        
        setUploadProgress(100);
      }

      if (editingDataset) {
        // Update existing dataset
        const { error } = await supabase
          .from('datasets')
          .update({
            name: formData.name,
            description: formData.description || null,
            file_path: filePath || editingDataset.file_path,
            file_size: fileSize || editingDataset.file_size,
            columns: columns || editingDataset.columns,
            sample_data: sampleData || editingDataset.sample_data,
            row_count: rowCount || editingDataset.row_count,
          })
          .eq('id', editingDataset.id);

        if (error) throw error;
        toast({ title: "Success", description: "Dataset updated successfully" });
      } else {
        // Create new dataset
        const { error } = await supabase
          .from('datasets')
          .insert({
            user_id: user.id,
            name: formData.name,
            description: formData.description || null,
            file_path: filePath,
            file_size: fileSize,
            columns: columns,
            sample_data: sampleData,
            row_count: rowCount,
          });

        if (error) throw error;
        toast({ title: "Success", description: "Dataset created successfully" });
      }

      setDialogOpen(false);
      setEditingDataset(null);
      setFormData({ name: "", description: "" });
      setSelectedFile(null);
      setUploadProgress(0);
      loadDatasets();
    } catch (error) {
      console.error('Error saving dataset:', error);
      toast({
        title: "Error",
        description: "Failed to save dataset",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (dataset: Dataset) => {
    setEditingDataset(dataset);
    setFormData({
      name: dataset.name,
      description: dataset.description || "",
    });
    setSelectedFile(null);
    setDialogOpen(true);
  };

  const handleDelete = async (datasetId: string) => {
    if (!confirm("Are you sure you want to delete this dataset?")) return;

    try {
      const { error } = await supabase
        .from('datasets')
        .delete()
        .eq('id', datasetId);

      if (error) throw error;
      toast({ title: "Success", description: "Dataset deleted successfully" });
      loadDatasets();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete dataset",
        variant: "destructive",
      });
    }
  };

  const handlePreview = (dataset: Dataset) => {
    setSelectedDatasetForPreview(dataset);
    setPreviewDialogOpen(true);
  };

  const handleAnalyze = (dataset: Dataset) => {
    if (onAnalyzeDataset) {
      onAnalyzeDataset(dataset.id);
      return;
    }
    toast({
      title: "Analyze Dataset",
      description: `Opening ${dataset.name} in the visualization tool...`,
    });
  };

  const openCreateDialog = () => {
    setEditingDataset(null);
    setFormData({ name: "", description: "" });
    setSelectedFile(null);
    setUploadProgress(0);
    setDialogOpen(true);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dataset Manager</h2>
          <p className="text-muted-foreground">Upload and manage your data for AI analysis</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              New Dataset
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingDataset ? "Edit Dataset" : "Create New Dataset"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Dataset name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="file">Upload File</Label>
                  <Input
                    id="file"
                    type="file"
                    accept=".csv,.json,.txt"
                    onChange={handleFileSelect}
                    disabled={loading}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Dataset description (optional)"
                  rows={3}
                />
              </div>
              {selectedFile && (
                <div className="p-4 border rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4" />
                    <span className="font-medium">{selectedFile.name}</span>
                    <Badge variant="secondary">{formatFileSize(selectedFile.size)}</Badge>
                  </div>
                  {uploadProgress > 0 && (
                    <Progress value={uploadProgress} className="w-full" />
                  )}
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : editingDataset ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Dataset Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Dataset Preview: {selectedDatasetForPreview?.name}</DialogTitle>
          </DialogHeader>
          {selectedDatasetForPreview && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Rows:</span> {selectedDatasetForPreview.row_count?.toLocaleString() || 'Unknown'}
                </div>
                <div>
                  <span className="font-medium">Columns:</span> {selectedDatasetForPreview.columns?.length || 0}
                </div>
                <div>
                  <span className="font-medium">File Size:</span> {selectedDatasetForPreview.file_size ? formatFileSize(selectedDatasetForPreview.file_size) : 'Unknown'}
                </div>
                <div>
                  <span className="font-medium">Created:</span> {new Date(selectedDatasetForPreview.created_at).toLocaleDateString()}
                </div>
              </div>
              
              {selectedDatasetForPreview.columns && (
                <div>
                  <h4 className="font-medium mb-2">Columns:</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedDatasetForPreview.columns.map((column, index) => (
                      <Badge key={index} variant="outline">{column}</Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {selectedDatasetForPreview.sample_data && selectedDatasetForPreview.sample_data.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Sample Data:</h4>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {selectedDatasetForPreview.columns?.map((column, index) => (
                            <TableHead key={index}>{column}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedDatasetForPreview.sample_data.map((row, rowIndex) => (
                          <TableRow key={rowIndex}>
                            {selectedDatasetForPreview.columns?.map((column, colIndex) => (
                              <TableCell key={colIndex}>{row[column] || ''}</TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {datasets.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Database className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No datasets yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Upload your first dataset to start analyzing data with AI.
              </p>
              <Button onClick={openCreateDialog}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Dataset
              </Button>
            </CardContent>
          </Card>
        ) : (
          datasets.map((dataset) => (
            <Card key={dataset.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{dataset.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {dataset.description || "No description"}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(dataset)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(dataset.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">
                      <Database className="h-3 w-3 mr-1" />
                      Dataset
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(dataset.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {dataset.file_path && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">File Size:</span>
                        <span>{dataset.file_size ? formatFileSize(dataset.file_size) : 'Unknown'}</span>
                      </div>
                      {dataset.row_count && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Rows:</span>
                          <span>{dataset.row_count.toLocaleString()}</span>
                        </div>
                      )}
                      {dataset.columns && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Columns:</span>
                          <span>{dataset.columns.length}</span>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handlePreview(dataset)}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Preview
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleAnalyze(dataset)}
                    >
                      <BarChart3 className="h-3 w-3 mr-1" />
                      Analyze
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}