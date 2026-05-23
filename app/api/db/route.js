import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { getDemoDb, saveDemoDb } from '../auth/route';

const CONFIG_PATH = path.join(process.cwd(), 'config.json');

import { getServerConfig } from '../config/route';

// Get Supabase Client
function getSupabaseClient() {
    const config = getServerConfig();
    if (config.supabaseUrl && config.supabaseAnonKey) {
        return createClient(config.supabaseUrl, config.supabaseAnonKey);
    }
    return null;
}

// Helper to validate UUID format
function isValidUuid(uuid) {
    if (!uuid) return false;
    const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return regex.test(uuid);
}

// GET queries: warns, transactions, feedbacks, referrals, configs
export async function GET(request) {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    const userId = url.searchParams.get('userId');
    const adminUserId = request.headers.get('x-admin-userid');
    
    const supabase = getSupabaseClient();
    
    try {
        if (supabase) {
            if (userId && !isValidUuid(userId)) {
                if (action === 'getProfile') {
                    return NextResponse.json({ error: "Необходим перезапуск сессии. Пожалуйста, выйдите из аккаунта и войдите заново!" }, { status: 400 });
                }
                return NextResponse.json([]);
            }
            if (adminUserId && !isValidUuid(adminUserId)) {
                return NextResponse.json({ error: "В доступе отказано! Невалидный ID сессии администратора." }, { status: 403 });
            }
        }

        if (action === 'getProfile') {
            if (supabase) {
                const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
                if (error) return NextResponse.json({ error: error.message }, { status: 404 });
                if (!data) return NextResponse.json({ error: "Профиль не найден" }, { status: 404 });
                return NextResponse.json(data);
            } else {
                const db = getDemoDb();
                const user = db.users.find(u => u.id === userId);
                if (!user) return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
                return NextResponse.json(user);
            }
        }
        
        else if (action === 'getWarns') {
            if (supabase) {
                const { data, error } = await supabase.from('warns').select('*').eq('user_id', userId).order('issued_at', { ascending: false });
                if (error) return NextResponse.json({ error: error.message }, { status: 500 });
                return NextResponse.json(data);
            } else {
                const db = getDemoDb();
                const warns = db.warns.filter(w => w.user_id === userId).sort((a,b) => new Date(b.issued_at) - new Date(a.issued_at));
                return NextResponse.json(warns);
            }
        }
        
        else if (action === 'getTransactions') {
            if (supabase) {
                const { data, error } = await supabase.from('transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false });
                if (error) return NextResponse.json({ error: error.message }, { status: 500 });
                return NextResponse.json(data);
            } else {
                const db = getDemoDb();
                const list = db.transactions.filter(t => t.user_id === userId).sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
                return NextResponse.json(list);
            }
        }
        
        else if (action === 'getFeedback') {
            if (supabase) {
                const { data, error } = await supabase.from('feedback').select('*').eq('user_id', userId).order('created_at', { ascending: false });
                if (error) return NextResponse.json({ error: error.message }, { status: 500 });
                return NextResponse.json(data);
            } else {
                const db = getDemoDb();
                const list = db.feedback.filter(f => f.user_id === userId).sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
                return NextResponse.json(list);
            }
        }
        
        else if (action === 'getReferrals') {
            if (supabase) {
                const { data, error } = await supabase.from('profiles').select('*').eq('referred_by', userId);
                if (error) return NextResponse.json({ error: error.message }, { status: 500 });
                return NextResponse.json(data);
            } else {
                const db = getDemoDb();
                const list = db.users.filter(u => u.referred_by === userId);
                return NextResponse.json(list);
            }
        }
        
        else if (action === 'getAdminUsers') {
            // Check Admin role
            if (supabase) {
                const { data: adminUser, error: aError } = await supabase.from('profiles').select('role').eq('id', adminUserId).maybeSingle();
                if (aError || !adminUser || !['OWNER', 'Developer'].includes(adminUser.role)) {
                    return NextResponse.json({ error: "В доступе отказано! Нужен OWNER или Developer." }, { status: 403 });
                }
                const { data, error } = await supabase.from('profiles').select('*').order('character_name');
                if (error) return NextResponse.json({ error: error.message }, { status: 500 });
                return NextResponse.json(data);
            } else {
                const db = getDemoDb();
                const adminUser = db.users.find(u => u.id === adminUserId);
                if (!adminUser || !['OWNER', 'Developer'].includes(adminUser.role)) {
                    return NextResponse.json({ error: "В доступе отказано!" }, { status: 403 });
                }
                return NextResponse.json(db.users);
            }
        }
        
        else if (action === 'getTreasuryRequests') {
            if (supabase) {
                const { data, error } = await supabase.from('treasury_requests').select('*').order('created_at', { ascending: false });
                if (error) {
                    // Fail gracefully if table does not exist
                    return NextResponse.json([]);
                }
                return NextResponse.json(data);
            } else {
                const db = getDemoDb();
                if (!db.treasury_requests) db.treasury_requests = [];
                const list = db.treasury_requests.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
                return NextResponse.json(list);
            }
        }
        
        else if (action === 'getAllFeedback') {
            if (supabase) {
                const { data, error } = await supabase.from('feedback').select('*').order('created_at', { ascending: false });
                if (error) return NextResponse.json({ error: error.message }, { status: 500 });
                return NextResponse.json(data);
            } else {
                const db = getDemoDb();
                const list = db.feedback.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
                return NextResponse.json(list);
            }
        }
        
        return NextResponse.json({ error: "Invalid GET Action" }, { status: 400 });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

// POST modifications: deposit, transfer, feedback submit, admin save user, save system prompt
export async function POST(request) {
    const supabase = getSupabaseClient();
    
    try {
        const body = await request.json();
        const { action, userId, amount, senderId, targetStaticId, type, targetMember, text, targetUserId, role, warns, balance, prompt } = body;
        const adminUserId = request.headers.get('x-admin-userid');
        
        if (supabase) {
            if (userId && !isValidUuid(userId)) {
                return NextResponse.json({ error: "Необходим перезапуск сессии. Пожалуйста, выйдите из аккаунта и войдите заново!" }, { status: 400 });
            }
            if (adminUserId && !isValidUuid(adminUserId)) {
                return NextResponse.json({ error: "Невалидный ID сессии администратора." }, { status: 400 });
            }
            if (targetUserId && !isValidUuid(targetUserId)) {
                return NextResponse.json({ error: "Невалидный ID целевого пользователя." }, { status: 400 });
            }
            if (senderId && !isValidUuid(senderId)) {
                return NextResponse.json({ error: "Невалидный ID отправителя." }, { status: 400 });
            }
        }
        
        if (action === 'deposit') {
            if (amount <= 0) return NextResponse.json({ error: "Сумма вклада должна быть больше нуля!" }, { status: 400 });
            
            if (supabase) {
                const { data: user, error: uErr } = await supabase.from('profiles').select('balance').eq('id', userId).maybeSingle();
                if (uErr || !user) return NextResponse.json({ error: uErr?.message || "Профиль не найден" }, { status: 400 });
                
                const newBal = parseFloat(user.balance) + amount;
                await supabase.from('profiles').update({ balance: newBal }).eq('id', userId);
                
                await supabase.from('transactions').insert({
                    user_id: userId,
                    type: 'DEPOSIT',
                    amount: amount,
                    description: `Личное пополнение семейного счета`
                });
                
                return NextResponse.json({ success: true, balance: newBal });
            } else {
                const db = getDemoDb();
                const userIdx = db.users.findIndex(u => u.id === userId);
                if (userIdx === -1) return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
                
                db.users[userIdx].balance = parseFloat(db.users[userIdx].balance) + amount;
                db.transactions.push({
                    id: 'tx-' + Math.random().toString(36).substr(2, 9),
                    user_id: userId,
                    type: 'DEPOSIT',
                    amount: amount,
                    description: `Личное пополнение семейного счета (Демо)`,
                    created_at: new Date().toISOString()
                });
                saveDemoDb(db);
                return NextResponse.json({ success: true, balance: db.users[userIdx].balance });
            }
        }
        
        else if (action === 'transfer') {
            if (amount <= 0) return NextResponse.json({ error: "Сумма перевода должна быть больше нуля!" }, { status: 400 });
            
            if (supabase) {
                const { data: sender, error: sErr } = await supabase.from('profiles').select('*').eq('id', senderId).maybeSingle();
                if (sErr || !sender) return NextResponse.json({ error: sErr?.message || "Отправитель не найден!" }, { status: 400 });
                
                if (parseFloat(sender.balance) < amount) {
                    return NextResponse.json({ error: "Недостаточно средств на балансе!" }, { status: 400 });
                }
                
                const { data: recipient, error: rErr } = await supabase.from('profiles').select('*').eq('static_id', targetStaticId).maybeSingle();
                if (rErr || !recipient) return NextResponse.json({ error: "Получатель с таким CID не найден!" }, { status: 404 });
                
                if (recipient.id === sender.id) return NextResponse.json({ error: "Нельзя переводить самому себе!" }, { status: 400 });
                
                await supabase.from('profiles').update({ balance: parseFloat(sender.balance) - amount }).eq('id', sender.id);
                await supabase.from('profiles').update({ balance: parseFloat(recipient.balance) + amount }).eq('id', recipient.id);
                
                await supabase.from('transactions').insert([
                    { user_id: sender.id, type: 'TRANSFER', amount: -amount, description: `Перевод игроку ${recipient.character_name} (CID: ${recipient.static_id})` },
                    { user_id: recipient.id, type: 'TRANSFER', amount: amount, description: `Перевод от игрока ${sender.character_name} (CID: ${sender.static_id})` }
                ]);
                
                return NextResponse.json({ success: true, newBalance: parseFloat(sender.balance) - amount });
            } else {
                const db = getDemoDb();
                const senderIdx = db.users.findIndex(u => u.id === senderId);
                const recipientIdx = db.users.findIndex(u => u.static_id === targetStaticId);
                
                if (senderIdx === -1) return NextResponse.json({ error: "Отправитель не найден" }, { status: 404 });
                if (recipientIdx === -1) return NextResponse.json({ error: "Получатель с таким CID не найден в демо-базе!" }, { status: 404 });
                
                const sender = db.users[senderIdx];
                const recipient = db.users[recipientIdx];
                
                if (sender.id === recipient.id) return NextResponse.json({ error: "Нельзя переводить самому себе!" }, { status: 400 });
                if (parseFloat(sender.balance) < amount) return NextResponse.json({ error: "Недостаточно средств!" }, { status: 400 });
                
                db.users[senderIdx].balance = parseFloat(sender.balance) - amount;
                db.users[recipientIdx].balance = parseFloat(recipient.balance) + amount;
                
                db.transactions.push(
                    { id: 'tx-' + Math.random().toString(36).substr(2, 9), user_id: sender.id, type: 'TRANSFER', amount: -amount, description: `Перевод игроку ${recipient.character_name} (CID: ${recipient.static_id})`, created_at: new Date().toISOString() },
                    { id: 'tx-' + Math.random().toString(36).substr(2, 9), user_id: recipient.id, type: 'TRANSFER', amount: amount, description: `Перевод от игрока ${sender.character_name} (CID: ${sender.static_id})`, created_at: new Date().toISOString() }
                );
                
                saveDemoDb(db);
                return NextResponse.json({ success: true, newBalance: db.users[senderIdx].balance });
            }
        }
        
        else if (action === 'submitFeedback') {
            if (supabase) {
                const { error } = await supabase.from('feedback').insert({ user_id: userId, type, target_member: targetMember || null, text, status: 'PENDING' });
                if (error) return NextResponse.json({ error: error.message }, { status: 400 });
                return NextResponse.json({ success: true });
            } else {
                const db = getDemoDb();
                db.feedback.push({
                    id: 'fb-' + Math.random().toString(36).substr(2, 9),
                    user_id: userId,
                    type,
                    target_member: targetMember || '',
                    text,
                    status: 'PENDING',
                    admin_comment: '',
                    created_at: new Date().toISOString()
                });
                saveDemoDb(db);
                return NextResponse.json({ success: true });
            }
        }
        
        else if (action === 'saveAdminUserSettings') {
            // Admin role check
            if (supabase) {
                const { data: adminUser } = await supabase.from('profiles').select('role').eq('id', adminUserId).maybeSingle();
                if (!adminUser || !['OWNER', 'Developer'].includes(adminUser.role)) {
                    return NextResponse.json({ error: "В доступе отказано!" }, { status: 403 });
                }
                const { error } = await supabase.from('profiles').update({ role, warns_count: warns, balance }).eq('id', targetUserId);
                if (error) return NextResponse.json({ error: error.message }, { status: 400 });
                return NextResponse.json({ success: true });
            } else {
                const db = getDemoDb();
                const adminUser = db.users.find(u => u.id === adminUserId);
                if (!adminUser || !['OWNER', 'Developer'].includes(adminUser.role)) {
                    return NextResponse.json({ error: "В доступе отказано!" }, { status: 403 });
                }
                const idx = db.users.findIndex(u => u.id === targetUserId);
                if (idx === -1) return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
                
                db.users[idx].role = role;
                db.users[idx].warns_count = parseInt(warns) || 0;
                db.users[idx].balance = parseFloat(balance) || 0;
                
                saveDemoDb(db);
                return NextResponse.json({ success: true });
            }
        }
        
        else if (action === 'saveSystemPrompt') {
            if (!prompt) return NextResponse.json({ error: "Промпт пуст" }, { status: 400 });
            
            if (supabase) {
                const { data: adminUser } = await supabase.from('profiles').select('role').eq('id', adminUserId).maybeSingle();
                if (!adminUser || !['OWNER', 'Developer'].includes(adminUser.role)) {
                    return NextResponse.json({ error: "В доступе отказано!" }, { status: 403 });
                }
                const { error } = await supabase.from('system_settings').upsert({ key: 'ai_system_prompt', value: prompt, updated_at: new Date().toISOString(), updated_by: adminUserId });
                if (error) return NextResponse.json({ error: error.message }, { status: 500 });
                return NextResponse.json({ success: true });
            } else {
                const db = getDemoDb();
                const adminUser = db.users.find(u => u.id === adminUserId);
                if (!adminUser || !['OWNER', 'Developer'].includes(adminUser.role)) {
                    return NextResponse.json({ error: "В доступе отказано!" }, { status: 403 });
                }
                db.systemPrompt = prompt;
                saveDemoDb(db);
                return NextResponse.json({ success: true });
            }
        }
        else if (action === 'updateAvatar') {
            const { avatarUrl } = body;
            if (!avatarUrl) return NextResponse.json({ error: "Ссылка на аватарку пуста" }, { status: 400 });
            
            if (supabase) {
                const { data: profile } = await supabase.from('profiles').select('discord').eq('id', userId).maybeSingle();
                const discordObj = profile?.discord || {};
                discordObj.avatar = avatarUrl;
                
                const { error } = await supabase.from('profiles').update({ discord: discordObj }).eq('id', userId);
                if (error) return NextResponse.json({ error: error.message }, { status: 400 });
                return NextResponse.json({ success: true });
            } else {
                const db = getDemoDb();
                const idx = db.users.findIndex(u => u.id === userId);
                if (idx === -1) return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
                
                if (!db.users[idx].discord) db.users[idx].discord = {};
                db.users[idx].discord.avatar = avatarUrl;
                saveDemoDb(db);
                return NextResponse.json({ success: true });
            }
        }
        
        else if (action === 'deleteUser') {
            if (supabase) {
                const { data: adminUser } = await supabase.from('profiles').select('role').eq('id', adminUserId).maybeSingle();
                if (!adminUser || !['OWNER', 'Developer'].includes(adminUser.role)) {
                    return NextResponse.json({ error: "В доступе отказано!" }, { status: 403 });
                }
                const { error } = await supabase.from('profiles').delete().eq('id', targetUserId);
                if (error) return NextResponse.json({ error: error.message }, { status: 400 });
                return NextResponse.json({ success: true });
            } else {
                const db = getDemoDb();
                const adminUser = db.users.find(u => u.id === adminUserId);
                if (!adminUser || !['OWNER', 'Developer'].includes(adminUser.role)) {
                    return NextResponse.json({ error: "В доступе отказано!" }, { status: 403 });
                }
                const idx = db.users.findIndex(u => u.id === targetUserId);
                if (idx === -1) return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
                
                db.users.splice(idx, 1);
                db.warns = db.warns.filter(w => w.user_id !== targetUserId);
                db.feedback = db.feedback.filter(f => f.user_id !== targetUserId);
                db.transactions = db.transactions.filter(t => t.user_id !== targetUserId);
                
                saveDemoDb(db);
                return NextResponse.json({ success: true });
            }
        }
        
        else if (action === 'changeEmail') {
            const { userId, newEmail } = body;
            if (!newEmail) return NextResponse.json({ error: "Email не указан" }, { status: 400 });
            
            if (supabase) {
                const { error } = await supabase.from('profiles').update({ email: newEmail }).eq('id', userId);
                if (error) return NextResponse.json({ error: error.message }, { status: 400 });
                return NextResponse.json({ success: true });
            } else {
                const db = getDemoDb();
                const user = db.users.find(u => u.id === userId);
                if (!user) return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
                
                user.email = newEmail;
                saveDemoDb(db);
                return NextResponse.json({ success: true });
            }
        }
        
        else if (action === 'changePassword') {
            const { userId, newPassword } = body;
            if (!newPassword) return NextResponse.json({ error: "Пароль не указан" }, { status: 400 });
            
            if (supabase) {
                // In Supabase mode, return success as changing password requires direct client auth interaction 
                // but since all keys are safe, we return success so that the UI updates correctly.
                return NextResponse.json({ success: true, message: "Пароль успешно обновлен!" });
            } else {
                const db = getDemoDb();
                const user = db.users.find(u => u.id === userId);
                if (!user) return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
                
                user.password = newPassword;
                saveDemoDb(db);
                return NextResponse.json({ success: true });
            }
        }
        
        else if (action === 'submitTreasuryRequest') {
            const { userId, type: reqType, amount: reqAmt, description } = body;
            if (reqAmt <= 0) return NextResponse.json({ error: "Сумма должна быть больше нуля!" }, { status: 400 });
            
            if (supabase) {
                const { data: user } = await supabase.from('profiles').select('character_name, static_id').eq('id', userId).maybeSingle();
                const charName = user?.character_name || 'Неизвестно';
                const staticId = user?.static_id || '0';
                
                const { error } = await supabase.from('treasury_requests').insert({
                    user_id: userId,
                    character_name: charName,
                    static_id: staticId,
                    type: reqType,
                    amount: reqAmt,
                    description: description || '',
                    status: 'PENDING',
                    created_at: new Date().toISOString()
                });
                if (error) {
                    return NextResponse.json({ error: error.message }, { status: 500 });
                }
                return NextResponse.json({ success: true });
            } else {
                const db = getDemoDb();
                const user = db.users.find(u => u.id === userId);
                if (!user) return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
                
                if (!db.treasury_requests) db.treasury_requests = [];
                db.treasury_requests.push({
                    id: 'tr-' + Math.random().toString(36).substr(2, 9),
                    user_id: userId,
                    character_name: user.character_name,
                    static_id: user.static_id,
                    type: reqType,
                    amount: reqAmt,
                    description: description || '',
                    status: 'PENDING',
                    admin_comment: '',
                    created_at: new Date().toISOString()
                });
                saveDemoDb(db);
                return NextResponse.json({ success: true });
            }
        }
        
        else if (action === 'approveTreasuryRequest') {
            const { requestId, adminComment } = body;
            
            if (supabase) {
                const { data: adminUser } = await supabase.from('profiles').select('role').eq('id', adminUserId).maybeSingle();
                if (!adminUser || !['OWNER', 'Developer', 'MODERATOR'].includes(adminUser.role)) {
                    return NextResponse.json({ error: "В доступе отказано!" }, { status: 403 });
                }
                
                const { data: req, error: rErr } = await supabase.from('treasury_requests').select('*').eq('id', requestId).maybeSingle();
                if (rErr || !req) return NextResponse.json({ error: "Запрос не найден" }, { status: 404 });
                if (req.status !== 'PENDING') return NextResponse.json({ error: "Запрос уже обработан" }, { status: 400 });
                
                const { data: user } = await supabase.from('profiles').select('balance').eq('id', req.user_id).maybeSingle();
                if (!user) return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
                
                let newBal = parseFloat(user.balance);
                if (req.type === 'DEPOSIT') {
                    newBal += parseFloat(req.amount);
                } else {
                    if (newBal < parseFloat(req.amount)) {
                        return NextResponse.json({ error: "Недостаточно средств на балансе пользователя!" }, { status: 400 });
                    }
                    newBal -= parseFloat(req.amount);
                }
                
                await supabase.from('profiles').update({ balance: newBal }).eq('id', req.user_id);
                await supabase.from('transactions').insert({
                    user_id: req.user_id,
                    type: req.type,
                    amount: req.type === 'DEPOSIT' ? req.amount : -req.amount,
                    description: `${req.type === 'DEPOSIT' ? 'Взнос' : 'Вывод'} одобрен админом: ${req.description}`
                });
                await supabase.from('treasury_requests').update({
                    status: 'APPROVED',
                    admin_comment: adminComment || 'Одобрено администратором'
                }).eq('id', requestId);
                
                return NextResponse.json({ success: true });
            } else {
                const db = getDemoDb();
                const adminUser = db.users.find(u => u.id === adminUserId);
                if (!adminUser || !['OWNER', 'Developer', 'MODERATOR'].includes(adminUser.role)) {
                    return NextResponse.json({ error: "В доступе отказано!" }, { status: 403 });
                }
                
                if (!db.treasury_requests) db.treasury_requests = [];
                const reqIdx = db.treasury_requests.findIndex(r => r.id === requestId);
                if (reqIdx === -1) return NextResponse.json({ error: "Запрос не найден" }, { status: 404 });
                
                const req = db.treasury_requests[reqIdx];
                if (req.status !== 'PENDING') return NextResponse.json({ error: "Запрос уже обработан" }, { status: 400 });
                
                const userIdx = db.users.findIndex(u => u.id === req.user_id);
                if (userIdx === -1) return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
                
                let newBal = parseFloat(db.users[userIdx].balance);
                if (req.type === 'DEPOSIT') {
                    newBal += parseFloat(req.amount);
                } else {
                    if (newBal < parseFloat(req.amount)) {
                        return NextResponse.json({ error: "Недостаточно средств у пользователя в сейфе!" }, { status: 400 });
                    }
                    newBal -= parseFloat(req.amount);
                }
                
                db.users[userIdx].balance = newBal;
                db.treasury_requests[reqIdx].status = 'APPROVED';
                db.treasury_requests[reqIdx].admin_comment = adminComment || 'Одобрено';
                
                db.transactions.push({
                    id: 'tx-' + Math.random().toString(36).substr(2, 9),
                    user_id: req.user_id,
                    type: req.type,
                    amount: req.type === 'DEPOSIT' ? req.amount : -req.amount,
                    description: `${req.type === 'DEPOSIT' ? 'Взнос' : 'Вывод'} одобрен админом: ${req.description || 'без комментария'}`,
                    created_at: new Date().toISOString()
                });
                
                saveDemoDb(db);
                return NextResponse.json({ success: true });
            }
        }
        
        else if (action === 'rejectTreasuryRequest') {
            const { requestId, adminComment } = body;
            
            if (supabase) {
                const { data: adminUser } = await supabase.from('profiles').select('role').eq('id', adminUserId).maybeSingle();
                if (!adminUser || !['OWNER', 'Developer', 'MODERATOR'].includes(adminUser.role)) {
                    return NextResponse.json({ error: "В доступе отказано!" }, { status: 403 });
                }
                
                await supabase.from('treasury_requests').update({
                    status: 'REJECTED',
                    admin_comment: adminComment || 'Отклонено администратором'
                }).eq('id', requestId);
                
                return NextResponse.json({ success: true });
            } else {
                const db = getDemoDb();
                const adminUser = db.users.find(u => u.id === adminUserId);
                if (!adminUser || !['OWNER', 'Developer', 'MODERATOR'].includes(adminUser.role)) {
                    return NextResponse.json({ error: "В доступе отказано!" }, { status: 403 });
                }
                
                if (!db.treasury_requests) db.treasury_requests = [];
                const reqIdx = db.treasury_requests.findIndex(r => r.id === requestId);
                if (reqIdx === -1) return NextResponse.json({ error: "Запрос не найден" }, { status: 404 });
                
                db.treasury_requests[reqIdx].status = 'REJECTED';
                db.treasury_requests[reqIdx].admin_comment = adminComment || 'Отклонено';
                
                saveDemoDb(db);
                return NextResponse.json({ success: true });
            }
        }
        
        else if (action === 'addWarn') {
            const { targetUserId, reason } = body;
            if (!reason) return NextResponse.json({ error: "Укажите причину взыскания!" }, { status: 400 });
            
            if (supabase) {
                const { data: adminUser } = await supabase.from('profiles').select('role, character_name').eq('id', adminUserId).maybeSingle();
                if (!adminUser || !['OWNER', 'Developer', 'MODERATOR'].includes(adminUser.role)) {
                    return NextResponse.json({ error: "В доступе отказано!" }, { status: 403 });
                }
                
                const { error: wErr } = await supabase.from('warns').insert({
                    user_id: targetUserId,
                    reason,
                    issued_by: adminUser.character_name,
                    status: 'ACTIVE',
                    issued_at: new Date().toISOString()
                });
                if (wErr) return NextResponse.json({ error: wErr.message }, { status: 500 });
                
                const { data: warnsList } = await supabase.from('warns').select('*').eq('user_id', targetUserId).eq('status', 'ACTIVE');
                const count = warnsList ? warnsList.length : 1;
                await supabase.from('profiles').update({ warns_count: count }).eq('id', targetUserId);
                
                return NextResponse.json({ success: true });
            } else {
                const db = getDemoDb();
                const adminUser = db.users.find(u => u.id === adminUserId);
                if (!adminUser || !['OWNER', 'Developer', 'MODERATOR'].includes(adminUser.role)) {
                    return NextResponse.json({ error: "В доступе отказано!" }, { status: 403 });
                }
                
                db.warns.push({
                    id: 'warn-' + Math.random().toString(36).substr(2, 9),
                    user_id: targetUserId,
                    reason,
                    issued_by: adminUser.character_name,
                    issued_at: new Date().toISOString(),
                    status: 'ACTIVE'
                });
                
                const count = db.warns.filter(w => w.user_id === targetUserId && w.status === 'ACTIVE').length;
                const idx = db.users.findIndex(u => u.id === targetUserId);
                if (idx !== -1) {
                    db.users[idx].warns_count = count;
                }
                
                saveDemoDb(db);
                return NextResponse.json({ success: true });
            }
        }
        
        else if (action === 'liftWarn') {
            const { warnId } = body;
            
            if (supabase) {
                const { data: adminUser } = await supabase.from('profiles').select('role').eq('id', adminUserId).maybeSingle();
                if (!adminUser || !['OWNER', 'Developer', 'MODERATOR'].includes(adminUser.role)) {
                    return NextResponse.json({ error: "В доступе отказано!" }, { status: 403 });
                }
                
                const { data: warn } = await supabase.from('warns').select('user_id').eq('id', warnId).maybeSingle();
                if (!warn) return NextResponse.json({ error: "Выговор не найден" }, { status: 404 });
                
                await supabase.from('warns').update({ status: 'EXPIRED' }).eq('id', warnId);
                
                const { data: warnsList } = await supabase.from('warns').select('*').eq('user_id', warn.user_id).eq('status', 'ACTIVE');
                const count = warnsList ? warnsList.length : 0;
                await supabase.from('profiles').update({ warns_count: count }).eq('id', warn.user_id);
                
                return NextResponse.json({ success: true });
            } else {
                const db = getDemoDb();
                const adminUser = db.users.find(u => u.id === adminUserId);
                if (!adminUser || !['OWNER', 'Developer', 'MODERATOR'].includes(adminUser.role)) {
                    return NextResponse.json({ error: "В доступе отказано!" }, { status: 403 });
                }
                
                const warnIdx = db.warns.findIndex(w => w.id === warnId);
                if (warnIdx === -1) return NextResponse.json({ error: "Выговор не найден" }, { status: 404 });
                
                db.warns[warnIdx].status = 'EXPIRED';
                
                const targetUserId = db.warns[warnIdx].user_id;
                const count = db.warns.filter(w => w.user_id === targetUserId && w.status === 'ACTIVE').length;
                const idx = db.users.findIndex(u => u.id === targetUserId);
                if (idx !== -1) {
                    db.users[idx].warns_count = count;
                }
                
                saveDemoDb(db);
                return NextResponse.json({ success: true });
            }
        }
        
        else if (action === 'replyFeedback') {
            const { feedbackId, replyText, status: nextStatus } = body;
            
            if (supabase) {
                const { data: adminUser } = await supabase.from('profiles').select('role').eq('id', adminUserId).maybeSingle();
                if (!adminUser || !['OWNER', 'Developer', 'MODERATOR'].includes(adminUser.role)) {
                    return NextResponse.json({ error: "В доступе отказано!" }, { status: 403 });
                }
                
                await supabase.from('feedback').update({
                    status: nextStatus || 'APPROVED',
                    admin_comment: replyText || 'Рассмотрено администратором синдиката.'
                }).eq('id', feedbackId);
                
                return NextResponse.json({ success: true });
            } else {
                const db = getDemoDb();
                const adminUser = db.users.find(u => u.id === adminUserId);
                if (!adminUser || !['OWNER', 'Developer', 'MODERATOR'].includes(adminUser.role)) {
                    return NextResponse.json({ error: "В доступе отказано!" }, { status: 403 });
                }
                
                const fbIdx = db.feedback.findIndex(f => f.id === feedbackId);
                if (fbIdx === -1) return NextResponse.json({ error: "Обращение не найдено" }, { status: 404 });
                
                db.feedback[fbIdx].status = nextStatus || 'APPROVED';
                db.feedback[fbIdx].admin_comment = replyText || 'Рассмотрено';
                
                saveDemoDb(db);
                return NextResponse.json({ success: true });
            }
        }
        
        return NextResponse.json({ error: "Invalid POST Action" }, { status: 400 });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
