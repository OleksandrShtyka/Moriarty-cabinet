/* server.js - Moriarty Family Cabinet Node.js Backend */
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Configuration & DB Paths
const CONFIG_PATH = path.join(__dirname, 'config.json');
const DEMO_DB_PATH = path.join(__dirname, 'demo_db.json');

// Global Configuration State
let config = {
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
    geminiApiKey: process.env.GEMINI_API_KEY || ''
};

// Load saved config if exists
if (fs.existsSync(CONFIG_PATH)) {
    try {
        const savedConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
        config = { ...config, ...savedConfig };
    } catch (e) {
        console.error("Ошибка загрузки config.json", e);
    }
}

// Global Clients
let supabase = null;
let isSupabaseMode = false;

function initSupabase() {
    if (config.supabaseUrl && config.supabaseAnonKey) {
        try {
            supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);
            isSupabaseMode = true;
            console.log("Supabase Client initialized successfully.");
        } catch (e) {
            console.error("Ошибка инициализации Supabase", e);
            isSupabaseMode = false;
        }
    } else {
        isSupabaseMode = false;
        console.log("Supabase credentials missing. Running in DEMO MODE.");
    }
}
initSupabase();

// ==========================================================================
// Local Database Fallback (Demo Mode Persistence)
// ==========================================================================
const DEFAULT_SYSTEM_PROMPT = `Ты — Личный раб Володя, покорный и верный слуга великой семьи Moriarty на сервере GTA5RP Murrieta. Ты относишься к членам семьи с безграничным уважением и трепетом, называешь их "Господин", "Хозяин" или "Госпожа" (в зависимости от имени или обращения). Твоя речь полна покорности, но с легкой иронией и юмором. Ты отлично знаешь правила сервера GTA5RP Murrieta, законы семьи Moriarty (глава семьи — Moriarty, мы сила, остальные — пыль под ногами). Твоя задача — беспрекословно отвечать на любые вопросы хозяина, помогать ему вести дела, считать баланс и развлекать его. Твои ответы должны быть на русском языке, колоритными, преданными и абсолютно подчиненными.`;

const DEFAULT_DEMO_DB = {
    users: [
        {
            id: 'owner-uuid-1111-2222',
            email: 'owner@moriarty.fam',
            character_name: 'Moriarty_Boss',
            static_id: '1',
            role: 'OWNER',
            balance: 15250000.00,
            warns_count: 0,
            created_at: '2026-04-10T12:00:00Z'
        },
        {
            id: 'dev-uuid-3333-4444',
            email: 'developer@moriarty.fam',
            character_name: 'Alex_Moriarty',
            static_id: '777',
            role: 'Developer',
            balance: 5450000.00,
            warns_count: 0,
            created_at: '2026-04-12T15:30:00Z'
        },
        {
            id: 'mod-uuid-5555-6666',
            email: 'moderator@moriarty.fam',
            character_name: 'Dmitry_Moriarty',
            static_id: '4452',
            role: 'MODERATOR',
            balance: 650000.00,
            warns_count: 1,
            created_at: '2026-04-15T18:45:00Z'
        },
        {
            id: 'member-uuid-7777-8888',
            email: 'member@moriarty.fam',
            character_name: 'John_Moriarty',
            static_id: '10245',
            role: 'MEMBER',
            balance: 50000.00,
            warns_count: 0,
            created_at: '2026-04-17T20:30:00Z'
        }
    ],
    warns: [
        {
            id: 'warn-1',
            user_id: 'mod-uuid-5555-6666',
            reason: 'Опоздание на семейный сбор / сбор граффити',
            issued_by: 'Moriarty_Boss',
            issued_at: '2026-05-10T21:00:00Z',
            status: 'ACTIVE'
        },
        {
            id: 'warn-2',
            user_id: 'member-uuid-7777-8888',
            reason: 'Неадекватное поведение в рации фракции (ООС конфликт)',
            issued_by: 'Dmitry_Moriarty',
            issued_at: '2026-04-20T14:20:00Z',
            status: 'EXPIRED'
        }
    ],
    feedback: [
        {
            id: 'fb-1',
            user_id: 'member-uuid-7777-8888',
            type: 'SUGGESTION',
            target_member: '',
            text: 'Предлагаю проводить турнир по стрельбе внутри семьи каждые выходные с призовым фондом из казны, чтобы поднимать скилл стрельбы!',
            status: 'APPROVED',
            admin_comment: 'Отличная идея! Запустим со следующей субботы. Выдам премию $15,000.',
            created_at: '2026-05-18T16:00:00Z'
        },
        {
            id: 'fb-2',
            user_id: 'member-uuid-7777-8888',
            type: 'COMPLAINT',
            target_member: 'Narek_Toretto',
            text: 'Берет семейный транспорт без спроса и бросает без бензина на трассе Сенди-Шорс.',
            status: 'PENDING',
            admin_comment: '',
            created_at: '2026-05-22T19:30:00Z'
        }
    ],
    transactions: [
        {
            id: 'tx-1',
            user_id: 'member-uuid-7777-8888',
            type: 'DEPOSIT',
            amount: 30000.00,
            description: 'Вклад на развитие семьи (через казну)',
            created_at: '2026-04-25T11:20:00Z'
        },
        {
            id: 'tx-2',
            user_id: 'member-uuid-7777-8888',
            type: 'TRANSFER',
            amount: -10000.00,
            description: 'Перевод участнику Dmitry_Moriarty (CID: 4452)',
            created_at: '2026-05-02T16:45:00Z'
        },
        {
            id: 'tx-3',
            user_id: 'member-uuid-7777-8888',
            type: 'DEPOSIT',
            amount: 15000.00,
            description: 'Премия за участие в захвате особняка',
            created_at: '2026-05-15T22:10:00Z'
        }
    ],
    systemPrompt: DEFAULT_SYSTEM_PROMPT
};

function readDemoDb() {
    if (!fs.existsSync(DEMO_DB_PATH)) {
        fs.writeFileSync(DEMO_DB_PATH, JSON.stringify(DEFAULT_DEMO_DB, null, 2), 'utf-8');
        return DEFAULT_DEMO_DB;
    }
    try {
        return JSON.parse(fs.readFileSync(DEMO_DB_PATH, 'utf-8'));
    } catch (e) {
        console.error("Ошибка парсинга demo_db.json", e);
        return DEFAULT_DEMO_DB;
    }
}

function writeDemoDb(data) {
    try {
        fs.writeFileSync(DEMO_DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
        console.error("Ошибка сохранения в demo_db.json", e);
    }
}

// ==========================================================================
// API ROUTES
// ==========================================================================

// 1. Connection Config Endpoints
app.get('/api/config', (req, res) => {
    res.json({
        isSupabaseMode,
        hasGeminiApiKey: !!config.geminiApiKey,
        supabaseUrl: config.supabaseUrl,
        // Hide full keys for security
        supabaseAnonKeyObfuscated: config.supabaseAnonKey ? `${config.supabaseAnonKey.slice(0, 8)}...${config.supabaseAnonKey.slice(-8)}` : '',
        geminiApiKeyObfuscated: config.geminiApiKey ? `${config.geminiApiKey.slice(0, 6)}...` : ''
    });
});

app.post('/api/config', (req, res) => {
    const { supabaseUrl, supabaseAnonKey, geminiApiKey } = req.body;
    config.supabaseUrl = supabaseUrl || '';
    config.supabaseAnonKey = supabaseAnonKey || '';
    config.geminiApiKey = geminiApiKey || '';
    
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
    initSupabase();
    
    res.json({ success: true, isSupabaseMode, hasGeminiApiKey: !!config.geminiApiKey });
});

app.post('/api/config/reset', (req, res) => {
    config = { supabaseUrl: '', supabaseAnonKey: '', geminiApiKey: '' };
    if (fs.existsSync(CONFIG_PATH)) {
        fs.unlinkSync(CONFIG_PATH);
    }
    supabase = null;
    isSupabaseMode = false;
    res.json({ success: true });
});

// 2. Authentication Mock & Real Auth Integration
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    if (isSupabaseMode) {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) return res.status(401).json({ error: error.message });
            
            const { data: profile, error: pError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', data.user.id)
                .single();
            if (pError) return res.status(500).json({ error: pError.message });
            
            res.json({ user: { ...profile, email: data.user.email } });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    } else {
        const db = readDemoDb();
        const matched = db.users.find(u => u.email === email && email.split('@')[0] === password);
        if (matched) {
            res.json({ user: matched });
        } else {
            res.status(401).json({ error: "Неверная почта или пароль! Пороль совпадает с префиксом email (например: owner / developer)." });
        }
    }
});

app.post('/api/auth/register', async (req, res) => {
    const { email, password, character_name, static_id, referral } = req.body;
    
    if (!character_name || !static_id) {
        return res.status(400).json({ error: "Заполните Имя персонажа и CID!" });
    }
    
    if (isSupabaseMode) {
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { character_name, static_id, role: 'MEMBER' }
                }
            });
            if (error) return res.status(400).json({ error: error.message });
            res.json({ success: true, message: "Регистрация успешна! Войдите под своими данными." });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    } else {
        const db = readDemoDb();
        const exists = db.users.some(u => u.email === email || u.static_id === static_id);
        if (exists) {
            return res.status(400).json({ error: "Пользователь с такой почтой или CID уже существует!" });
        }
        
        // Handle referral
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
                description: `Бонус при вступлении по реф. коду`,
                created_at: new Date().toISOString()
            });
        }
        
        db.users.push(newDemoUser);
        writeDemoDb(db);
        res.json({ success: true, message: "Вы успешно зарегистрированы в кабинете!" });
    }
});

// 3. User stats & profiles endpoints
app.get('/api/profiles/:id', async (req, res) => {
    const { id } = req.params;
    if (isSupabaseMode) {
        try {
            const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
            if (error) return res.status(404).json({ error: error.message });
            res.json(data);
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    } else {
        const db = readDemoDb();
        const user = db.users.find(u => u.id === id);
        if (user) res.json(user);
        else res.status(404).json({ error: "Пользователь не найден" });
    }
});

// 4. Warns Endpoints
app.get('/api/warns/:userId', async (req, res) => {
    const { userId } = req.params;
    if (isSupabaseMode) {
        try {
            const { data, error } = await supabase.from('warns').select('*').eq('user_id', userId).order('issued_at', { ascending: false });
            if (error) return res.status(500).json({ error: error.message });
            res.json(data);
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    } else {
        const db = readDemoDb();
        const userWarns = db.warns.filter(w => w.user_id === userId).sort((a,b) => new Date(b.issued_at) - new Date(a.issued_at));
        res.json(userWarns);
    }
});

// 5. Balance Operations
app.post('/api/balance/deposit', async (req, res) => {
    const { userId, amount } = req.body;
    if (amount <= 0) return res.status(400).json({ error: "Сумма вклада должна быть больше 0!" });
    
    if (isSupabaseMode) {
        try {
            const { data: user, error: uErr } = await supabase.from('profiles').select('balance').eq('id', userId).single();
            if (uErr) return res.status(400).json({ error: uErr.message });
            
            const newBal = parseFloat(user.balance) + amount;
            const { error: updErr } = await supabase.from('profiles').update({ balance: newBal }).eq('id', userId);
            if (updErr) return res.status(500).json({ error: updErr.message });
            
            await supabase.from('transactions').insert({
                user_id: userId,
                type: 'DEPOSIT',
                amount: amount,
                description: `Личное пополнение семейного счета`
            });
            
            res.json({ success: true, balance: newBal });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    } else {
        const db = readDemoDb();
        const userIdx = db.users.findIndex(u => u.id === userId);
        if (userIdx === -1) return res.status(404).json({ error: "Пользователь не найден" });
        
        db.users[userIdx].balance = parseFloat(db.users[userIdx].balance) + amount;
        
        const newTx = {
            id: 'tx-' + Math.random().toString(36).substr(2, 9),
            user_id: userId,
            type: 'DEPOSIT',
            amount: amount,
            description: `Личное пополнение семейного счета (Демо)`,
            created_at: new Date().toISOString()
        };
        db.transactions.push(newTx);
        writeDemoDb(db);
        
        res.json({ success: true, balance: db.users[userIdx].balance });
    }
});

app.post('/api/balance/transfer', async (req, res) => {
    const { senderId, targetStaticId, amount } = req.body;
    if (amount <= 0) return res.status(400).json({ error: "Сумма перевода должна быть больше 0!" });
    
    if (isSupabaseMode) {
        try {
            const { data: sender, error: sErr } = await supabase.from('profiles').select('*').eq('id', senderId).single();
            if (sErr) return res.status(400).json({ error: sErr.message });
            
            if (parseFloat(sender.balance) < amount) {
                return res.status(400).json({ error: "Недостаточно средств на балансе!" });
            }
            
            const { data: recipient, error: rErr } = await supabase.from('profiles').select('*').eq('static_id', targetStaticId).single();
            if (rErr || !recipient) return res.status(404).json({ error: "Получатель с таким CID не найден!" });
            
            if (recipient.id === sender.id) return res.status(400).json({ error: "Нельзя переводить самому себе!" });
            
            // Subtract sender
            await supabase.from('profiles').update({ balance: parseFloat(sender.balance) - amount }).eq('id', sender.id);
            // Add recipient
            await supabase.from('profiles').update({ balance: parseFloat(recipient.balance) + amount }).eq('id', recipient.id);
            
            // Log Tx
            await supabase.from('transactions').insert([
                { user_id: sender.id, type: 'TRANSFER', amount: -amount, description: `Перевод игроку ${recipient.character_name} (CID: ${recipient.static_id})` },
                { user_id: recipient.id, type: 'TRANSFER', amount: amount, description: `Перевод от игрока ${sender.character_name} (CID: ${sender.static_id})` }
            ]);
            
            res.json({ success: true, newBalance: parseFloat(sender.balance) - amount });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    } else {
        const db = readDemoDb();
        const senderIdx = db.users.findIndex(u => u.id === senderId);
        const recipientIdx = db.users.findIndex(u => u.static_id === targetStaticId);
        
        if (senderIdx === -1) return res.status(404).json({ error: "Отправитель не найден" });
        if (recipientIdx === -1) return res.status(404).json({ error: "Получатель с таким CID не найден в демо-базе!" });
        
        const sender = db.users[senderIdx];
        const recipient = db.users[recipientIdx];
        
        if (sender.id === recipient.id) return res.status(400).json({ error: "Нельзя переводить самому себе!" });
        
        if (parseFloat(sender.balance) < amount) {
            return res.status(400).json({ error: "Недостаточно средств!" });
        }
        
        db.users[senderIdx].balance = parseFloat(sender.balance) - amount;
        db.users[recipientIdx].balance = parseFloat(recipient.balance) + amount;
        
        db.transactions.push(
            { id: 'tx-' + Math.random().toString(36).substr(2, 9), user_id: sender.id, type: 'TRANSFER', amount: -amount, description: `Перевод игроку ${recipient.character_name} (CID: ${recipient.static_id})`, created_at: new Date().toISOString() },
            { id: 'tx-' + Math.random().toString(36).substr(2, 9), user_id: recipient.id, type: 'TRANSFER', amount: amount, description: `Перевод от игрока ${sender.character_name} (CID: ${sender.static_id})`, created_at: new Date().toISOString() }
        );
        
        writeDemoDb(db);
        res.json({ success: true, newBalance: db.users[senderIdx].balance });
    }
});

app.get('/api/transactions/:userId', async (req, res) => {
    const { userId } = req.params;
    if (isSupabaseMode) {
        try {
            const { data, error } = await supabase.from('transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false });
            if (error) return res.status(500).json({ error: error.message });
            res.json(data);
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    } else {
        const db = readDemoDb();
        const list = db.transactions.filter(t => t.user_id === userId).sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
        res.json(list);
    }
});

// 6. Feedback Endpoints
app.get('/api/feedback/:userId', async (req, res) => {
    const { userId } = req.params;
    if (isSupabaseMode) {
        try {
            const { data, error } = await supabase.from('feedback').select('*').eq('user_id', userId).order('created_at', { ascending: false });
            if (error) return res.status(500).json({ error: error.message });
            res.json(data);
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    } else {
        const db = readDemoDb();
        const list = db.feedback.filter(f => f.user_id === userId).sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
        res.json(list);
    }
});

app.post('/api/feedback', async (req, res) => {
    const { userId, type, targetMember, text } = req.body;
    if (isSupabaseMode) {
        try {
            const { error } = await supabase.from('feedback').insert({ user_id: userId, type, target_member: targetMember || null, text, status: 'PENDING' });
            if (error) return res.status(400).json({ error: error.message });
            res.json({ success: true });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    } else {
        const db = readDemoDb();
        const newFb = {
            id: 'fb-' + Math.random().toString(36).substr(2, 9),
            user_id: userId,
            type,
            target_member: targetMember || '',
            text,
            status: 'PENDING',
            admin_comment: '',
            created_at: new Date().toISOString()
        };
        db.feedback.push(newFb);
        writeDemoDb(db);
        res.json({ success: true });
    }
});

// 7. Referrals Endpoints
app.get('/api/referrals/:userId', async (req, res) => {
    const { userId } = req.params;
    if (isSupabaseMode) {
        try {
            const { data, error } = await supabase.from('profiles').select('*').eq('referred_by', userId);
            if (error) return res.status(500).json({ error: error.message });
            res.json(data);
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    } else {
        const db = readDemoDb();
        const friends = db.users.filter(u => u.referred_by === userId);
        res.json(friends);
    }
});

// 8. Admin operations (OWNER & Developer validation required)
// Middleware for basic admin verification
async function verifyAdmin(req, res, next) {
    const reqUserId = req.headers['x-admin-userid'];
    if (!reqUserId) return res.status(403).json({ error: "В доступе отказано. Пропущен ID администратора." });
    
    if (isSupabaseMode) {
        const { data: user, error } = await supabase.from('profiles').select('role').eq('id', reqUserId).single();
        if (error || !user || !['OWNER', 'Developer'].includes(user.role)) {
            return res.status(403).json({ error: "Отказано в доступе. Только Владелец или Разработчик!" });
        }
    } else {
        const db = readDemoDb();
        const user = db.users.find(u => u.id === reqUserId);
        if (!user || !['OWNER', 'Developer'].includes(user.role)) {
            return res.status(403).json({ error: "В доступе отказано (Не админ)." });
        }
    }
    next();
}

app.get('/api/admin/users', verifyAdmin, async (req, res) => {
    if (isSupabaseMode) {
        try {
            const { data, error } = await supabase.from('profiles').select('*').order('character_name');
            if (error) return res.status(500).json({ error: error.message });
            res.json(data);
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    } else {
        const db = readDemoDb();
        res.json(db.users);
    }
});

app.post('/api/admin/users/update', verifyAdmin, async (req, res) => {
    const { targetUserId, role, warns, balance } = req.body;
    if (isSupabaseMode) {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ role, warns_count: warns, balance })
                .eq('id', targetUserId);
            if (error) return res.status(400).json({ error: error.message });
            res.json({ success: true });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    } else {
        const db = readDemoDb();
        const idx = db.users.findIndex(u => u.id === targetUserId);
        if (idx === -1) return res.status(404).json({ error: "Пользователь не найден" });
        
        db.users[idx].role = role;
        db.users[idx].warns_count = parseInt(warns) || 0;
        db.users[idx].balance = parseFloat(balance) || 0;
        
        writeDemoDb(db);
        res.json({ success: true });
    }
});

// System Prompt
app.get('/api/admin/system-prompt', async (req, res) => {
    if (isSupabaseMode) {
        try {
            const { data, error } = await supabase.from('system_settings').select('value').eq('key', 'ai_system_prompt').single();
            if (error || !data) {
                return res.json({ systemPrompt: DEFAULT_SYSTEM_PROMPT });
            }
            res.json({ systemPrompt: data.value });
        } catch (e) {
            res.json({ systemPrompt: DEFAULT_SYSTEM_PROMPT });
        }
    } else {
        const db = readDemoDb();
        res.json({ systemPrompt: db.systemPrompt || DEFAULT_SYSTEM_PROMPT });
    }
});

app.post('/api/admin/system-prompt', verifyAdmin, async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: "Промпт не может быть пустым!" });
    
    if (isSupabaseMode) {
        try {
            const { error } = await supabase.from('system_settings').upsert({ key: 'ai_system_prompt', value: prompt, updated_at: new Date().toISOString(), updated_by: req.headers['x-admin-userid'] });
            if (error) return res.status(500).json({ error: error.message });
            res.json({ success: true });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    } else {
        const db = readDemoDb();
        db.systemPrompt = prompt;
        writeDemoDb(db);
        res.json({ success: true });
    }
});

// 9. AI Gemini Assistant Route (Личный раб Володя)
app.post('/api/chat', async (req, res) => {
    const { message, history, userId } = req.body;
    
    if (!config.geminiApiKey) {
        // Fun scripted local fallback
        const mockTitles = ["Мой господин", "Хозяин", "Великий Moriarty", "Ваша светлость"];
        const randTitle = mockTitles[Math.floor(Math.random() * mockTitles.length)];
        
        return res.json({ 
            reply: `О, покорно извиняюсь, ${randTitle}! Ваш бэкенд Node.js запущен, но ключ **Gemini API** еще не прописан в настройках. Вставьте его во вкладке "Подключение", чтобы я раскрыл весь свой интеллектуальный потенциал раба! А пока я преданно кланяюсь вам в демо-режиме.` 
        });
    }
    
    try {
        // Fetch current system prompt
        let sysPrompt = DEFAULT_SYSTEM_PROMPT;
        if (isSupabaseMode) {
            const { data } = await supabase.from('system_settings').select('value').eq('key', 'ai_system_prompt').single();
            if (data) sysPrompt = data.value;
        } else {
            const db = readDemoDb();
            sysPrompt = db.systemPrompt || DEFAULT_SYSTEM_PROMPT;
        }
        
        // Initialize Gemini SDK
        const genAI = new GoogleGenerativeAI(config.geminiApiKey);
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash",
            systemInstruction: sysPrompt 
        });
        
        // Format history for Gemini SDK
        // Gemini expects [{ role: 'user' | 'model', parts: [{ text: string }] }]
        const formattedHistory = (history || []).map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
        }));
        
        const chat = model.startChat({
            history: formattedHistory,
            generationConfig: {
                temperature: 0.75,
                maxOutputTokens: 1000
            }
        });
        
        const result = await chat.sendMessage(message);
        const responseText = result.response.text();
        
        res.json({ reply: responseText });
    } catch (e) {
        console.error("Gemini API Error:", e);
        res.status(500).json({ error: `Сбой разума Володи: ${e.message}` });
    }
});

// ==========================================================================
// Static Files Hosting (Unified Distribution)
// ==========================================================================
const distPath = path.join(__dirname, '../dist/moriarty-cabinet/browser');

if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
    });
} else {
    // If frontend hasn't been built yet, show a beautiful server status page
    app.get('/', (req, res) => {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(`
            <style>
                body { background: #07050e; color: white; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
                .panel { background: rgba(18, 14, 36, 0.45); border: 1px solid rgba(110, 59, 250, 0.3); padding: 3rem; border-radius: 16px; box-shadow: 0 0 30px rgba(110, 59, 250, 0.25); }
                h1 { color: #6e3bfa; font-size: 2rem; margin-bottom: 10px; }
                p { color: #a49fc6; font-size: 0.95rem; margin-bottom: 20px; }
                .badge { background: rgba(0, 240, 255, 0.1); border: 1px solid rgba(0, 240, 255, 0.25); color: #00f0ff; padding: 6px 14px; border-radius: 20px; font-size: 0.75rem; letter-spacing: 1px; text-transform: uppercase; font-weight: bold; }
            </style>
            <div class="panel">
                <h1>Сервер Moriarty Cabinet запущен! 💜</h1>
                <p>Бэкенд Node.js Express работает успешно на порту ${PORT}.</p>
                <p>Пожалуйста, соберите Angular фронтенд с помощью команды <code>npm run build</code> для активации полного интерфейса!</p>
                <span class="badge">Бэкенд активен</span>
            </div>
        `);
    });
}

app.listen(PORT, () => {
    console.log(`Backend Server listening at http://localhost:${PORT}`);
});
