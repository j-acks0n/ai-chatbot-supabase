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

-- Enable RLS on new tables
ALTER TABLE public.memory_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_usage ENABLE ROW LEVEL SECURITY;

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