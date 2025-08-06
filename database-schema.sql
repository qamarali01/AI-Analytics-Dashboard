-- AI Dashboard Database Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Datasets table
CREATE TABLE IF NOT EXISTS datasets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    file_path TEXT,
    file_size BIGINT,
    row_count INTEGER,
    columns TEXT[],
    sample_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    is_user BOOLEAN NOT NULL,
    dataset_context TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_datasets_user_id ON datasets(user_id);
CREATE INDEX IF NOT EXISTS idx_datasets_created_at ON datasets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for datasets
CREATE POLICY "Users can view their own datasets" ON datasets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own datasets" ON datasets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own datasets" ON datasets
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own datasets" ON datasets
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for chat_messages
CREATE POLICY "Users can view their own chat messages" ON chat_messages
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chat messages" ON chat_messages
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chat messages" ON chat_messages
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chat messages" ON chat_messages
    FOR DELETE USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_datasets_updated_at 
    BEFORE UPDATE ON datasets 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Storage bucket for datasets
-- Note: This needs to be created in the Supabase dashboard under Storage
-- Bucket name: 'datasets'
-- Public bucket: false
-- File size limit: 50MB
-- Allowed MIME types: text/csv, application/json, text/plain

-- Storage policies for datasets bucket
-- Run these after creating the 'datasets' bucket in the dashboard

-- Allow users to upload files to their own folder
CREATE POLICY "Users can upload files to their own folder" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'datasets' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Allow users to view their own files
CREATE POLICY "Users can view their own files" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'datasets' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Allow users to update their own files
CREATE POLICY "Users can update their own files" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'datasets' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Allow users to delete their own files
CREATE POLICY "Users can delete their own files" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'datasets' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Sample data for testing (optional)
-- INSERT INTO datasets (user_id, name, description, columns, sample_data, row_count) 
-- VALUES (
--     'your-user-id-here',
--     'Sample Sales Data',
--     'Monthly sales data for 2024',
--     ARRAY['Month', 'Sales', 'Profit', 'Region'],
--     '[
--         {"Month": "January", "Sales": 12000, "Profit": 2400, "Region": "North"},
--         {"Month": "February", "Sales": 15000, "Profit": 3000, "Region": "North"},
--         {"Month": "March", "Sales": 18000, "Profit": 3600, "Region": "North"}
--     ]'::jsonb,
--     3
-- ); 