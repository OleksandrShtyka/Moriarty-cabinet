import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const CONFIG_PATH = path.join(process.cwd(), 'config.json');
const DEMO_DB_PATH = path.join(process.cwd(), 'demo_db.json');

// Default initial Demo DB
const DEFAULT_SYSTEM_PROMPT = `Ты — Личный раб Володя, покорный и верный слуга великой семьи Moriarty на сервере GTA5RP Murrieta. Ты относишься к членам семьи с безграничным уважением и трепетом, называешь их "Господин", "Хозяин" или "Госпожа" (в зависимости от имени или обращения). Твоя речь полна покорности, но с легкой иронией и юмором. Ты отлично знаешь правила сервера GTA5RP Murrieta, законы семьи Moriarty (глава семьи — Moriarty, мы сила, остальные — пыль под ногами). Твоя задача — беспрекословно отвечать на любые вопросы хозяина, помогать ему вести дела, считать баланс и развлекать его. Твои ответы должны быть на русском языке, колоритными, преданными и абсолютно подчиненными.`;

const DEFAULT_DEMO_DB = {
    users: [
        { id: 'owner-uuid-1111-2222', email: 'owner@moriarty.fam', character_name: 'Moriarty_Boss', static_id: '1', role: 'OWNER', balance: 15250000.00, warns_count: 0, created_at: '2026-04-10T12:00:00Z' },
        { id: 'dev-uuid-3333-4444', email: 'developer@moriarty.fam', character_name: 'Alex_Moriarty', static_id: '777', role: 'Developer', balance: 5450000.00, warns_count: 0, created_at: '2026-04-12T15:30:00Z' },
        { id: 'mod-uuid-5555-6666', email: 'moderator@moriarty.fam', character_name: 'Dmitry_Moriarty', static_id: '4452', role: 'MODERATOR', balance: 650000.00, warns_count: 1, created_at: '2026-04-15T18:45:00Z' },
        { id: 'member-uuid-7777-8888', email: 'member@moriarty.fam', character_name: 'John_Moriarty', static_id: '10245', role: 'MEMBER', balance: 50000.00, warns_count: 0, created_at: '2026-04-17T20:30:00Z' }
    ],
    warns: [
        { id: 'warn-1', user_id: 'mod-uuid-5555-6666', reason: 'Опоздание на семейный сбор / сбор граффити', issued_by: 'Moriarty_Boss', issued_at: '2026-05-10T21:00:00Z', status: 'ACTIVE' },
        { id: 'warn-2', user_id: 'member-uuid-7777-8888', reason: 'Неадекватное поведение в рации фракции (ООС конфликт)', issued_by: 'Dmitry_Moriarty', issued_at: '2026-04-20T14:20:00Z', status: 'EXPIRED' }
    ],
    feedback: [
        { id: 'fb-1', user_id: 'member-uuid-7777-8888', type: 'SUGGESTION', target_member: '', text: 'Предлагаю проводить турнир по стрельбе внутри семьи каждые выходные с призовым фондом из казны, чтобы поднимать скилл стрельбы!', status: 'APPROVED', admin_comment: 'Отличная идея! Запустим со следующей субботы. Выдам премию $15,000.', created_at: '2026-05-18T16:00:00Z' },
        { id: 'fb-2', user_id: 'member-uuid-7777-8888', type: 'COMPLAINT', target_member: 'Narek_Toretto', text: 'Берет семейный транспорт без спроса и бросает без бензина на трассе Сенди-Шорс.', status: 'PENDING', admin_comment: '', created_at: '2026-05-22T19:30:00Z' }
    ],
    transactions: [
        { id: 'tx-1', user_id: 'member-uuid-7777-8888', type: 'DEPOSIT', amount: 30000.00, description: 'Вклад на развитие семьи (через казну)', created_at: '2026-04-25T11:20:00Z' },
        { id: 'tx-2', user_id: 'member-uuid-7777-8888', type: 'TRANSFER', amount: -10000.00, description: 'Перевод участнику Dmitry_Moriarty (CID: 4452)', created_at: '2026-05-02T16:45:00Z' },
        { id: 'tx-3', user_id: 'member-uuid-7777-8888', type: 'DEPOSIT', amount: 15000.00, description: 'Премия за участие в захвате особняка', created_at: '2026-05-15T22:10:00Z' }
    ],
    systemPrompt: DEFAULT_SYSTEM_PROMPT
};

export function getDemoDb() {
    if (!fs.existsSync(DEMO_DB_PATH)) {
        fs.writeFileSync(DEMO_DB_PATH, JSON.stringify(DEFAULT_DEMO_DB, null, 2), 'utf-8');
        return DEFAULT_DEMO_DB;
    }
    try {
        return JSON.parse(fs.readFileSync(DEMO_DB_PATH, 'utf-8'));
    } catch (e) {
        return DEFAULT_DEMO_DB;
    }
}

export function saveDemoDb(data) {
    try {
        fs.writeFileSync(DEMO_DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
        console.error(e);
    }
}

import { getServerConfig } from '../config/route';

function getSupabaseClient() {
    const config = getServerConfig();
    if (config.supabaseUrl && config.supabaseAnonKey) {
        return createClient(config.supabaseUrl, config.supabaseAnonKey);
    }
    return null;
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { action, email, password, character_name, static_id, referral } = body;
        
        const supabase = getSupabaseClient();
        
        if (action === 'login') {
            if (supabase) {
                const { data, error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) return NextResponse.json({ error: error.message }, { status: 401 });
                
                let { data: profile, error: pError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', data.user.id)
                    .maybeSingle();
                
                if (pError) return NextResponse.json({ error: pError.message }, { status: 500 });
                
                if (!profile) {
                    // Self-healing: automatically create the public profile row if missing
                    const newProfile = {
                        id: data.user.id,
                        email: data.user.email,
                        character_name: data.user.user_metadata?.character_name || 'Arthur_Moriarty',
                        static_id: data.user.user_metadata?.static_id || `ID-${Math.floor(Math.random() * 9000 + 1000)}`,
                        role: data.user.user_metadata?.role || 'MEMBER',
                        balance: 50000.00,
                        warns_count: 0,
                        created_at: new Date().toISOString()
                    };
                    
                    const { error: insErr } = await supabase.from('profiles').insert(newProfile);
                    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });
                    
                    profile = newProfile;
                }
                
                return NextResponse.json({ user: { ...profile, email: data.user.email } });
            } else {
                const db = getDemoDb();
                const matched = db.users.find(u => u.email === email && (u.password ? u.password === password : email.split('@')[0] === password));
                if (matched) {
                    return NextResponse.json({ user: matched });
                } else {
                    return NextResponse.json({ error: "Неверный email или пароль!" }, { status: 401 });
                }
            }
        } else if (action === 'register') {
            if (!character_name || !static_id) {
                return NextResponse.json({ error: "Заполните Имя и CID!" }, { status: 400 });
            }
            
            if (supabase) {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: { character_name, static_id, role: 'MEMBER' }
                    }
                });
                if (error) return NextResponse.json({ error: error.message }, { status: 400 });
                return NextResponse.json({ success: true, message: "Вы успешно зарегистрированы в облачной базе!" });
            } else {
                const db = getDemoDb();
                const exists = db.users.some(u => u.email === email || u.static_id === static_id);
                if (exists) {
                    return NextResponse.json({ error: "Участник с таким email или CID уже существует!" }, { status: 400 });
                }
                
                // Referral logic
                let referredBy = null;
                if (referral) {
                    const referrer = db.users.find(u => `MORI-${u.static_id}` === referral.toUpperCase());
                    if (referrer) {
                        referredBy = referrer.id;
                        referrer.balance = parseFloat(referrer.balance) + 10000.00;
                        
                        db.transactions.push({
                            id: 'tx-ref-' + Math.random().toString(36).substr(2, 9),
                            user_id: referrer.id,
                            type: 'DEPOSIT',
                            amount: 10000.00,
                            description: `Реферальный бонус за приглашение ${character_name}`,
                            created_at: new Date().toISOString()
                        });
                    }
                }
                
                const newDemoUser = {
                    id: 'user-uuid-' + Math.random().toString(36).substr(2, 9),
                    email,
                    character_name,
                    static_id,
                    role: 'MEMBER',
                    balance: referredBy ? 60000.00 : 50000.00,
                    warns_count: 0,
                    referred_by: referredBy,
                    created_at: new Date().toISOString()
                };
                
                if (referredBy) {
                    db.transactions.push({
                        id: 'tx-ref-new-' + Math.random().toString(36).substr(2, 9),
                        user_id: newDemoUser.id,
                        type: 'DEPOSIT',
                        amount: 10000.00,
                        description: `Бонус при регистрации по реф. коду`,
                        created_at: new Date().toISOString()
                    });
                }
                
                db.users.push(newDemoUser);
                saveDemoDb(db);
                return NextResponse.json({ success: true, message: "Вы успешно зарегистрированы в демо-кабинете!" });
            }
        }
        
        return NextResponse.json({ error: "Invalid Action" }, { status: 400 });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
