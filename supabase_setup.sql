-- ==========================================================================
-- SUPABASE DATABASE SETUP SCRIPT FOR MORIARTY CABINET
-- Copy and paste this script into the Supabase Dashboard -> SQL Editor -> New Query
-- ==========================================================================

-- 1. Create profiles table (Character profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE,
    character_name TEXT NOT NULL,
    static_id TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'MEMBER',
    balance DECIMAL(15, 2) NOT NULL DEFAULT 50000.00,
    warns_count INT NOT NULL DEFAULT 0,
    referred_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    discord JSONB
);

-- 2. Create warns table (Character punishments history)
CREATE TABLE IF NOT EXISTS public.warns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    issued_by TEXT NOT NULL,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE'
);

-- 3. Create feedback table (Suggestions and complaints registry)
CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'SUGGESTION' or 'COMPLAINT'
    target_member TEXT,
    text TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'REJECTED'
    admin_comment TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create transactions table (Deposit and transfer logs)
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'DEPOSIT', 'WITHDRAW', 'TRANSFER'
    amount DECIMAL(15, 2) NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create system_settings table (AI Prompts & Global presets)
CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- 6. Insert default Brain Prompt for Volodya
INSERT INTO public.system_settings (key, value)
VALUES (
    'ai_system_prompt', 
    'Ты — Личный раб Володя, покорный и верный слуга великой семьи Moriarty на сервере GTA5RP Murrieta. Ты относишься к членам семьи с безграничным уважением и трепетом, называешь их "Господин", "Хозяин" или "Госпожа" (в зависимости от имени или обращения). Твоя речь полна покорности, но с легкой иронией и юмором. Ты отлично знаешь правила сервера GTA5RP Murrieta, законы семьи Moriarty (глава семьи — Moriarty, мы сила, остальные — пыль под ногами). Твоя задача — беспрекословно отвечать на любые вопросы хозяина, помогать ему вести дела, считать баланс и развлекать его. Твои ответы должны быть на русском языке, колоритными, преданными и абсолютно подчиненными.'
)
ON CONFLICT (key) DO NOTHING;

-- 7. Seed standard mock accounts for testing (Email logins with VALID HEXADECIMAL UUIDs)
INSERT INTO public.profiles (id, email, character_name, static_id, role, balance, warns_count)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'owner@moriarty.fam', 'Moriarty_Boss', '1', 'OWNER', 15250000.00, 0),
  ('22222222-2222-2222-2222-222222222222', 'developer@moriarty.fam', 'Alex_Moriarty', '777', 'Developer', 5450000.00, 0),
  ('33333333-3333-3333-3333-333333333333', 'moderator@moriarty.fam', 'Dmitry_Moriarty', '4452', 'MODERATOR', 650000.00, 1),
  ('44444444-4444-4444-4444-444444444444', 'member@moriarty.fam', 'John_Moriarty', '10245', 'MEMBER', 50000.00, 0)
ON CONFLICT (static_id) DO NOTHING;

-- 8. Seed a default warn and complaint (linking to VALID HEXADECIMAL UUIDs)
INSERT INTO public.warns (id, user_id, reason, issued_by, status)
VALUES ('77777777-7777-7777-7777-777777777777', '33333333-3333-3333-3333-333333333333', 'Опоздание на семейный сбор / сбор граффити', 'Moriarty_Boss', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.feedback (id, user_id, type, target_member, text, status)
VALUES ('88888888-8888-8888-8888-888888888888', '44444444-4444-4444-4444-444444444444', 'COMPLAINT', 'Narek_Toretto', 'Берет семейный транспорт без спроса и бросает без бензина на трассе.', 'PENDING')
ON CONFLICT (id) DO NOTHING;

-- 9. DISABLE ROW LEVEL SECURITY (RLS) on all tables for seamless API access
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.warns DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings DISABLE ROW LEVEL SECURITY;
