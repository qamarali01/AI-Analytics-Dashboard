import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Send, Bot, User, Database, Sparkles } from "lucide-react";

interface Message {
  id: string;
  content: string;
  is_user: boolean;
  created_at: string;
  dataset_context?: string;
}

interface Dataset {
  id: string;
  name: string;
  description: string | null;
  sample_data?: any[];
  columns?: string[];
  row_count?: number;
}

function ChatInterfaceInner() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<string>("");
  const [aiMode, setAiMode] = useState<"general" | "data_analysis">("general");
  const [error, setError] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  console.log('ChatInterface rendering, aiMode:', aiMode, 'datasets:', datasets.length);

  useEffect(() => {
    console.log('ChatInterface useEffect running');
    loadMessages();
    loadDatasets();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  };

  const loadMessages = async () => {
    try {
      console.log('Loading messages...');
      setError(null);
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      console.log('Messages loaded:', data?.length || 0);
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
      setError('Failed to load chat history');
      toast({
        title: "Error",
        description: "Failed to load chat history",
        variant: "destructive",
      });
    }
  };

  const loadDatasets = async () => {
    try {
      console.log('Loading datasets...');
      setError(null);
      const { data, error } = await supabase
        .from('datasets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log('Datasets loaded:', data?.length || 0);
      setDatasets(data || []);
    } catch (error) {
      console.error('Error loading datasets:', error);
      setError('Failed to load datasets');
    }
  };

  const saveMessage = async (content: string, isUser: boolean, datasetContext?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          user_id: user.id,
          content,
          is_user: isUser,
          dataset_context: datasetContext,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving message:', error);
      throw error;
    }
  };

  const callOpenAI = async (userMessage: string, dataset?: Dataset): Promise<string> => {
    const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    if (!openaiApiKey) {
      return "I'm sorry, but I need an OpenAI API key to provide intelligent responses. Please add your OpenAI API key to the environment variables (VITE_OPENAI_API_KEY) to enable real AI analysis.";
    }

    try {
      let systemPrompt = "You are a helpful AI assistant.";
      let userPrompt = userMessage;

      if (dataset && aiMode === "data_analysis") {
        // Create a much more detailed and specific prompt for data analysis
        const sampleDataString = dataset.sample_data && dataset.sample_data.length > 0 
          ? JSON.stringify(dataset.sample_data.slice(0, 8), null, 2) 
          : "No sample data available";
        
        systemPrompt = `You are a data analysis expert. You have access to a dataset called "${dataset.name}" with the following structure:

COLUMNS: ${dataset.columns?.join(', ') || 'No columns available'}

SAMPLE DATA (first 8 rows):
${sampleDataString}

TOTAL ROWS: ${dataset.row_count || 'Unknown'}

INSTRUCTIONS:
- Analyze the actual data provided above
- Reference specific values, names, numbers, and trends from the sample data
- Provide concrete insights based on the data, not generic statements
- If asked about specific metrics (salary, performance, etc.), calculate and mention actual values
- If asked about comparisons, use the actual data to make comparisons
- Be specific and quantitative in your analysis
- If the data shows patterns or outliers, point them out with specific examples

When analyzing this data, always reference the actual values and provide specific insights rather than generic observations.`;
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          max_tokens: 800,
          temperature: 0.3
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI API error:', error);
      return `I encountered an error while processing your request: ${error instanceof Error ? error.message : 'Unknown error'}. Please check your OpenAI API key and try again.`;
    }
  };

  const generateAIResponse = async (userMessage: string, context?: string): Promise<string> => {
    const selectedDatasetData = datasets.find(d => d.id === selectedDataset);
    
    if (aiMode === "data_analysis" && selectedDatasetData) {
      return await callOpenAI(userMessage, selectedDatasetData);
    } else {
      return await callOpenAI(userMessage);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setLoading(true);

    try {
      const selectedDatasetName = datasets.find(d => d.id === selectedDataset)?.name;
      const datasetContext = selectedDatasetName || undefined;

      // Save user message
      const userMsg = await saveMessage(userMessage, true, datasetContext);
      setMessages(prev => [...prev, userMsg]);

      // Generate and save AI response
      const aiResponse = await generateAIResponse(userMessage, datasetContext);
      const aiMsg = await saveMessage(aiResponse, false, datasetContext);
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error('Error in chat:', error);
      toast({
        title: "Error",
        description: "Failed to process message",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Show error state if there's an error
  if (error) {
    return (
      <Card className="h-[calc(100vh-8rem)] flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            AI Chat Assistant
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Reload Page
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-[calc(100vh-12rem)] flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            AI Chat Assistant
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={aiMode} onValueChange={(value: "general" | "data_analysis") => setAiMode(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="data_analysis">Data Analysis</SelectItem>
              </SelectContent>
            </Select>
            {aiMode === "data_analysis" && (
              <Select value={selectedDataset || "none"} onValueChange={value => setSelectedDataset(value === "none" ? "" : value)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select dataset" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No dataset</SelectItem>
                  {datasets.map((dataset) => (
                    <SelectItem key={dataset.id} value={dataset.id}>
                      {dataset.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
        {aiMode === "data_analysis" && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Database className="h-4 w-4" />
            <span>Data Analysis Mode</span>
            {selectedDataset && (
              <Badge variant="secondary">
                {datasets.find(d => d.id === selectedDataset)?.name}
              </Badge>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0 min-h-0">
        <ScrollArea ref={scrollAreaRef} className="flex-1 p-4 min-h-0">
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Start a conversation with your AI assistant!</p>
                {aiMode === "data_analysis" && (
                  <p className="text-sm mt-2">Select a dataset to enable data-aware responses</p>
                )}
              </div>
            )}
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.is_user ? 'justify-end' : 'justify-start'}`}
              >
                {!message.is_user && (
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    message.is_user
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  {message.dataset_context && !message.is_user && (
                    <div className="mt-2 pt-2 border-t border-border/50">
                      <Badge variant="outline" className="text-xs">
                        <Database className="h-3 w-3 mr-1" />
                        {message.dataset_context}
                      </Badge>
                    </div>
                  )}
                </div>
                {message.is_user && (
                  <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                    <User className="h-4 w-4 text-secondary-foreground" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-3 justify-start">
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 animate-pulse" />
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        <div className="p-4 border-t bg-background">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={aiMode === "data_analysis" ? "Ask about your data..." : "Type your message..."}
              disabled={loading}
              className="flex-1"
            />
            <Button onClick={handleSend} disabled={loading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ChatInterface() {
  try {
    return <ChatInterfaceInner />;
  } catch (error) {
    console.error('ChatInterface error:', error);
    return (
      <Card className="h-[calc(100vh-8rem)] flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            AI Chat Assistant
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-500 mb-4">Something went wrong loading the chat interface.</p>
            <Button onClick={() => window.location.reload()}>
              Reload Page
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
}