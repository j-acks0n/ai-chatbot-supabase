-- Create memory profiles table
CREATE TABLE IF NOT EXISTS public.memory_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    relationship TEXT, -- e.g., "father", "mother", "friend", "partner"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Communication style analysis
    average_message_length INTEGER DEFAULT 0,
    common_words TEXT[] DEFAULT '{}',
    emoticons_used TEXT[] DEFAULT '{}',
    communication_patterns TEXT[] DEFAULT '{}',
    punctuation_style TEXT[] DEFAULT '{}',
    capitalization_style TEXT DEFAULT 'mixed case',
    greeting_patterns TEXT[] DEFAULT '{}',
    farewell_patterns TEXT[] DEFAULT '{}',
    question_style TEXT[] DEFAULT '{}',
    response_style TEXT[] DEFAULT '{}',
    typical_phrases TEXT[] DEFAULT '{}',
    message_timing TEXT[] DEFAULT '{}',
    
    -- Training data metadata
    total_messages INTEGER DEFAULT 0,
    date_range_start DATE,
    date_range_end DATE,
    training_status TEXT DEFAULT 'pending' CHECK (training_status IN ('pending', 'processing', 'completed', 'failed'))
);

-- Create training messages table (stores original WhatsApp messages)
CREATE TABLE IF NOT EXISTS public.training_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    memory_profile_id UUID NOT NULL REFERENCES public.memory_profiles(id) ON DELETE CASCADE,
    original_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    content TEXT NOT NULL,
    message_order INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create memory conversations table (different from regular chats)
CREATE TABLE IF NOT EXISTS public.memory_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    memory_profile_id UUID NOT NULL REFERENCES public.memory_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create memory messages table (conversations with the memory)
CREATE TABLE IF NOT EXISTS public.memory_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    memory_conversation_id UUID NOT NULL REFERENCES public.memory_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create memory sessions table (tracks 10-minute sessions)
CREATE TABLE IF NOT EXISTS public.memory_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    memory_profile_id UUID NOT NULL REFERENCES public.memory_profiles(id) ON DELETE CASCADE,
    session_start TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    session_end TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create monthly usage tracking table
CREATE TABLE IF NOT EXISTS public.monthly_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    usage_month DATE NOT NULL, -- First day of the month (e.g., 2024-01-01)
    sessions_used INTEGER DEFAULT 0,
    last_session_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Ensure one record per user per month
    UNIQUE(user_id, usage_month)
);

-- Enable RLS on all new tables
ALTER TABLE public.memory_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memory_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memory_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memory_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_usage ENABLE ROW LEVEL SECURITY;

-- RLS policies for memory_profiles
CREATE POLICY "Users can manage their own memory profiles"
ON public.memory_profiles
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS policies for training_messages
CREATE POLICY "Users can access training messages for their profiles"
ON public.training_messages
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.memory_profiles mp
        WHERE mp.id = training_messages.memory_profile_id
        AND mp.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.memory_profiles mp
        WHERE mp.id = training_messages.memory_profile_id
        AND mp.user_id = auth.uid()
    )
);

-- RLS policies for memory_conversations
CREATE POLICY "Users can manage their own memory conversations"
ON public.memory_conversations
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS policies for memory_messages
CREATE POLICY "Users can access messages in their memory conversations"
ON public.memory_messages
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.memory_conversations mc
        WHERE mc.id = memory_messages.memory_conversation_id
        AND mc.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.memory_conversations mc
        WHERE mc.id = memory_messages.memory_conversation_id
        AND mc.user_id = auth.uid()
    )
);

-- RLS policies for memory_sessions
CREATE POLICY "Users can manage their own memory sessions"
ON public.memory_sessions
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS policies for monthly_usage
CREATE POLICY "Users can manage their own monthly usage"
ON public.monthly_usage
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX memory_profiles_user_id_idx ON public.memory_profiles(user_id);
CREATE INDEX training_messages_memory_profile_id_idx ON public.training_messages(memory_profile_id);
CREATE INDEX memory_conversations_user_id_idx ON public.memory_conversations(user_id);
CREATE INDEX memory_conversations_memory_profile_id_idx ON public.memory_conversations(memory_profile_id);
CREATE INDEX memory_messages_conversation_id_idx ON public.memory_messages(memory_conversation_id);
CREATE INDEX memory_sessions_user_id_idx ON public.memory_sessions(user_id);
CREATE INDEX memory_sessions_active_idx ON public.memory_sessions(user_id, is_active) WHERE is_active = true;
CREATE INDEX monthly_usage_user_month_idx ON public.monthly_usage(user_id, usage_month);

-- Function to close expired sessions automatically
CREATE OR REPLACE FUNCTION close_expired_sessions()
RETURNS void AS $$
BEGIN
    UPDATE public.memory_sessions 
    SET is_active = false, 
        session_end = session_start + INTERVAL '10 minutes'
    WHERE is_active = true 
    AND session_start + INTERVAL '10 minutes' < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update monthly usage
CREATE OR REPLACE FUNCTION update_monthly_usage()
RETURNS TRIGGER AS $$
DECLARE
    current_month DATE;
BEGIN
    -- Get the first day of the current month
    current_month := DATE_TRUNC('month', NEW.session_start)::DATE;
    
    -- Insert or update monthly usage
    INSERT INTO public.monthly_usage (user_id, usage_month, sessions_used, last_session_date)
    VALUES (NEW.user_id, current_month, 1, NEW.session_start)
    ON CONFLICT (user_id, usage_month)
    DO UPDATE SET 
        sessions_used = monthly_usage.sessions_used + 1,
        last_session_date = NEW.session_start,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_update_monthly_usage
    AFTER INSERT ON public.memory_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_monthly_usage();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_memory_profiles_updated_at
    BEFORE UPDATE ON public.memory_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_memory_conversations_updated_at
    BEFORE UPDATE ON public.memory_conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON public.memory_profiles TO authenticated;
GRANT ALL ON public.training_messages TO authenticated;
GRANT ALL ON public.memory_conversations TO authenticated;
GRANT ALL ON public.memory_messages TO authenticated; 