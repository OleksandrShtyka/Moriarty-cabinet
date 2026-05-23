import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { getDemoDb, saveDemoDb } from '../route';

const CONFIG_PATH = path.join(process.cwd(), 'config.json');

import { getServerConfig } from '../../config/route';

// Helper to generate a valid UUID v4
function generateUuidV4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Helper to obtain Supabase Client
function getSupabaseClient() {
    const config = getServerConfig();
    if (config.supabaseUrl && config.supabaseAnonKey) {
        return createClient(config.supabaseUrl, config.supabaseAnonKey);
    }
    return null;
}

// POST endpoint handles: (1) simulated login, (2) manual callback payload
export async function POST(request) {
    try {
        const body = await request.json();
        const { simulate, code, redirectUri } = body;
        
        const config = getServerConfig();
        const supabase = getSupabaseClient();
        
        let discordUser = null;
        
        if (simulate) {
            // Simulated OAuth Discord callback data for DEMO
            const randId = Math.floor(Math.random() * 9000000000 + 1000000000).toString();
            const discUsernames = ['Arthur_Moriarty', 'Viktor_Moriarty', 'Elena_Moriarty', 'Narek_Moriarty', 'Tigran_Moriarty'];
            const randName = discUsernames[Math.floor(Math.random() * discUsernames.length)];
            
            discordUser = {
                id: randId,
                username: `${randName.split('_')[0]}_Moriarty_DS`,
                discord_tag: `${randName.split('_')[0].toLowerCase()}#${Math.floor(Math.random() * 9000 + 1000)}`,
                avatar: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${randName}&backgroundColor=6e3bfa`,
                character_name: randName
            };
        } else if (code) {
            // Real OAuth Exchange
            if (!config.discordClientId || !config.discordClientSecret) {
                return NextResponse.json({ error: "Настройки Discord OAuth2 не заполнены на сервере!" }, { status: 400 });
            }
            
            // Exchange code for token
            const tokenParams = new URLSearchParams({
                client_id: config.discordClientId,
                client_secret: config.discordClientSecret,
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: redirectUri
            });
            
            const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: tokenParams
            });
            
            if (!tokenResponse.ok) {
                const err = await tokenResponse.json();
                return NextResponse.json({ error: `Discord Token Exchange error: ${err.error_description || tokenResponse.statusText}` }, { status: 400 });
            }
            
            const tokenData = await tokenResponse.json();
            const accessToken = tokenData.access_token;
            
            // Fetch profile info
            const userResponse = await fetch('https://discord.com/api/users/@me', {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            
            if (!userResponse.ok) {
                return NextResponse.json({ error: "Не удалось получить профиль Discord!" }, { status: 400 });
            }
            
            const dProfile = await userResponse.json();
            discordUser = {
                id: dProfile.id,
                username: dProfile.global_name || dProfile.username,
                discord_tag: `${dProfile.username}#${dProfile.discriminator || '0000'}`,
                avatar: dProfile.avatar 
                    ? `https://cdn.discordapp.com/avatars/${dProfile.id}/${dProfile.avatar}.png`
                    : `https://api.dicebear.com/7.x/bottts/svg?seed=${dProfile.id}`,
                character_name: `${dProfile.username.charAt(0).toUpperCase() + dProfile.username.slice(1)}_Moriarty`
            };
        } else {
            return NextResponse.json({ error: "Missing authentication parameters" }, { status: 400 });
        }
        
        // Match user or register
        const isBinding = body.state && body.state.startsWith('BIND:');
        const bindingUserId = isBinding ? body.state.split('BIND:')[1] : null;

        if (supabase) {
            if (isBinding) {
                // Link Discord metadata to the existing user profile
                const { error: updErr } = await supabase
                    .from('profiles')
                    .update({ discord: discordUser })
                    .eq('id', bindingUserId);
                    
                if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });
                
                const { data: updatedProfile, error: getErr } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', bindingUserId)
                    .maybeSingle();
                    
                if (getErr || !updatedProfile) return NextResponse.json({ error: "Ошибка при получении профиля после привязки" }, { status: 500 });
                
                return NextResponse.json({ user: updatedProfile });
            }

            // Look up in profiles - match by either static_id OR the nested discord.id
            const { data: existing, error } = await supabase
                .from('profiles')
                .select('*')
                .or(`static_id.eq.DS-${discordUser.id},discord->>id.eq.${discordUser.id}`)
                .maybeSingle();
                
            if (existing) {
                // Update avatar or fields if needed
                return NextResponse.json({ user: existing });
            } else {
                // Create profile under static_id 'DS-ID'
                const newProfile = {
                    id: generateUuidV4(),
                    character_name: discordUser.character_name,
                    static_id: `DS-${discordUser.id}`,
                    role: 'MEMBER',
                    balance: 50000.00,
                    warns_count: 0,
                    discord: discordUser, // Save discord profile directly
                    created_at: new Date().toISOString()
                };
                
                const { error: insError } = await supabase.from('profiles').insert(newProfile);
                if (insError) return NextResponse.json({ error: insError.message }, { status: 500 });
                
                return NextResponse.json({ user: { ...newProfile, discordUser } });
            }
        } else {
            // Local Demo Database
            const db = getDemoDb();
            
            if (isBinding) {
                const idx = db.users.findIndex(u => u.id === bindingUserId);
                if (idx !== -1) {
                    db.users[idx].discord = discordUser;
                    saveDemoDb(db);
                    return NextResponse.json({ user: db.users[idx] });
                }
                return NextResponse.json({ error: "Пользователь не найден для привязки" }, { status: 404 });
            }

            const existing = db.users.find(u => u.static_id === `DS-${discordUser.id}` || (u.discord && u.discord.id === discordUser.id));
            
            if (existing) {
                existing.discord = discordUser;
                saveDemoDb(db);
                return NextResponse.json({ user: existing });
            } else {
                const newDemoUser = {
                    id: 'user-uuid-' + Math.random().toString(36).substr(2, 9),
                    email: `${discordUser.username.toLowerCase()}@moriarty.fam`,
                    character_name: discordUser.character_name,
                    static_id: `DS-${discordUser.id}`,
                    role: 'MEMBER',
                    balance: 50000.00,
                    warns_count: 0,
                    created_at: new Date().toISOString(),
                    discord: discordUser
                };
                
                db.users.push(newDemoUser);
                saveDemoDb(db);
                return NextResponse.json({ user: newDemoUser });
            }
        }
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
