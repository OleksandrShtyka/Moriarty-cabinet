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

// GET queries: warns, transactions, feedbacks, referrals, configs
export async function GET(request) {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    const userId = url.searchParams.get('userId');
    const adminUserId = request.headers.get('x-admin-userid');
    
    const supabase = getSupabaseClient();
    
    try {
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
        
        return NextResponse.json({ error: "Invalid POST Action" }, { status: 400 });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
