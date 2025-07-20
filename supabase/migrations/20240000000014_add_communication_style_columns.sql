-- Add new communication style columns to memory_profiles table
ALTER TABLE public.memory_profiles 
ADD COLUMN IF NOT EXISTS punctuation_style TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS capitalization_style TEXT DEFAULT 'mixed case',
ADD COLUMN IF NOT EXISTS greeting_patterns TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS farewell_patterns TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS question_style TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS response_style TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS typical_phrases TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS message_timing TEXT[] DEFAULT '{}'; 