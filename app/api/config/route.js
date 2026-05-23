import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const CONFIG_PATH = path.join(process.cwd(), 'config.json');

function readConfig() {
    if (!fs.existsSync(CONFIG_PATH)) {
        return { supabaseUrl: '', supabaseAnonKey: '', geminiApiKey: '', discordClientId: '', discordClientSecret: '' };
    }
    try {
        return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
    } catch (e) {
        return { supabaseUrl: '', supabaseAnonKey: '', geminiApiKey: '', discordClientId: '', discordClientSecret: '' };
    }
}

export function getServerConfig() {
    const config = readConfig();
    return {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || config.supabaseUrl || '',
        supabaseAnonKey: process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || config.supabaseAnonKey || '',
        geminiApiKey: process.env.GEMINI_API_KEY || config.geminiApiKey || '',
        discordClientId: process.env.DISCORD_CLIENT_ID || config.discordClientId || '',
        discordClientSecret: process.env.DISCORD_CLIENT_SECRET || config.discordClientSecret || ''
    };
}

export async function GET() {
    const serverConfig = getServerConfig();
    return NextResponse.json({
        isSupabaseMode: !!(serverConfig.supabaseUrl && serverConfig.supabaseAnonKey),
        hasGeminiApiKey: !!serverConfig.geminiApiKey,
        supabaseUrl: serverConfig.supabaseUrl,
        hasDiscordConfig: !!(serverConfig.discordClientId && serverConfig.discordClientSecret),
        discordClientId: serverConfig.discordClientId,
        // Mask sensitive items
        supabaseAnonKeyObfuscated: serverConfig.supabaseAnonKey ? `${serverConfig.supabaseAnonKey.slice(0, 8)}...` : '',
        geminiApiKeyObfuscated: serverConfig.geminiApiKey ? `${serverConfig.geminiApiKey.slice(0, 6)}...` : ''
    });
}

export async function POST(request) {
    try {
        const body = await request.json();
        const current = readConfig();
        
        const updated = {
            supabaseUrl: body.supabaseUrl !== undefined ? body.supabaseUrl : current.supabaseUrl,
            supabaseAnonKey: body.supabaseAnonKey !== undefined ? body.supabaseAnonKey : current.supabaseAnonKey,
            geminiApiKey: body.geminiApiKey !== undefined ? body.geminiApiKey : current.geminiApiKey,
            discordClientId: body.discordClientId !== undefined ? body.discordClientId : current.discordClientId,
            discordClientSecret: body.discordClientSecret !== undefined ? body.discordClientSecret : current.discordClientSecret
        };
        
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(updated, null, 2), 'utf-8');
        
        return NextResponse.json({
            success: true,
            isSupabaseMode: !!(updated.supabaseUrl && updated.supabaseAnonKey),
            hasGeminiApiKey: !!updated.geminiApiKey,
            hasDiscordConfig: !!(updated.discordClientId && updated.discordClientSecret)
        });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function DELETE() {
    if (fs.existsSync(CONFIG_PATH)) {
        fs.unlinkSync(CONFIG_PATH);
    }
    return NextResponse.json({ success: true });
}
