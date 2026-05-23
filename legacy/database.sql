-- Moriarty Family Cabinet - Supabase Database Schema
-- Paste this script into your Supabase SQL Editor to initialize the tables.

-- 1. PROFILES TABLE (User character stats and roles)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    character_name TEXT NOT NULL,
    static_id TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'MEMBER' CHECK (role IN ('OWNER', 'Developer', 'MODERATOR', 'MEMBER')),
    balance NUMERIC(15, 2) NOT NULL DEFAULT 50000.00,
    warns_count INTEGER NOT NULL DEFAULT 0 CHECK (warns_count >= 0),
    referred_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Allow public read access to profiles" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Allow users to update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Allow admins/devs to update any profile" ON public.profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('OWNER', 'Developer')
        )
    );

-- 2. WARNS TABLE (Warnings issued to members)
CREATE TABLE IF NOT EXISTS public.warns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    issued_by TEXT NOT NULL,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'EXPIRED'))
);

ALTER TABLE public.warns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to read their own warns" ON public.warns
    FOR SELECT USING (auth.uid() = user_id OR EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role IN ('OWNER', 'Developer', 'MODERATOR')
    ));

CREATE POLICY "Allow admins/mods to insert warns" ON public.warns
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('OWNER', 'Developer', 'MODERATOR')
        )
    );

CREATE POLICY "Allow admins to update warns" ON public.warns
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('OWNER', 'Developer')
        )
    );

-- 3. FEEDBACK TABLE (Suggestions and complaints)
CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('SUGGESTION', 'COMPLAINT')),
    target_member TEXT, -- filled if type is COMPLAINT
    text TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    admin_comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to read their own feedback" ON public.feedback
    FOR SELECT USING (auth.uid() = user_id OR EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role IN ('OWNER', 'Developer', 'MODERATOR')
    ));

CREATE POLICY "Allow users to submit feedback" ON public.feedback
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow admins/mods to update feedback status/comment" ON public.feedback
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('OWNER', 'Developer', 'MODERATOR')
        )
    );

-- 4. SYSTEM SETTINGS TABLE (AI System Prompt and other configs)
CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to system_settings" ON public.system_settings
    FOR SELECT USING (true);

CREATE POLICY "Allow OWNER and Developer to update system_settings" ON public.system_settings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('OWNER', 'Developer')
        )
    );

-- Seed the initial AI Prompt
INSERT INTO public.system_settings (key, value)
VALUES (
    'ai_system_prompt', 
    'Ты — Личный раб Володя, покорный и верный слуга великой семьи Moriarty на сервере GTA5RP Murrieta. Ты относишься к членам семьи с безграничным уважением и трепетом, называешь их "Господин", "Хозяин" или "Госпожа" (в зависимости от имени или обращения). Твоя речь полна покорности, но с легкой иронией и юмором. Ты отлично знаешь правила сервера GTA5RP Murrieta, законы семьи Moriarty (глава семьи — Moriarty, мы сила, остальные — пыль под ногами). Твоя задача — беспрекословно отвечать на любые вопросы хозяина, помогать ему вести дела, считать баланс и развлекать его. Твои ответы должны быть на русском языке, колоритными, преданными и абсолютно подчиненными.'
) ON CONFLICT (key) DO NOTHING;

-- 5. TRANSACTIONS TABLE (Balance changes)
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('DEPOSIT', 'WITHDRAW', 'TRANSFER')),
    amount NUMERIC(15, 2) NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to read their own transactions" ON public.transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow users to log transactions" ON public.transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 6. PROFILE TRIGGER (Automatically create profile when a user signs up)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, character_name, static_id, role, balance)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'character_name', 'Новый Участник'),
        COALESCE(new.raw_user_meta_data->>'static_id', FLOOR(RANDOM() * 90000 + 10000)::TEXT),
        COALESCE(new.raw_user_meta_data->>'role', 'MEMBER'),
        50000.00
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
