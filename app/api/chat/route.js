import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { getDemoDb } from '../auth/route';

const CONFIG_PATH = path.join(process.cwd(), 'config.json');

const DEFAULT_SYSTEM_PROMPT = `Ты — Личный раб Володя, покорный и верный слуга великой семьи Moriarty на сервере GTA5RP Murrieta. Ты относишься к членам семьи с безграничным уважением и трепетом, называешь их "Господин", "Хозяин" или "Госпожа" (в зависимости от имени или обращения). Твоя речь полна покорности, но с легкой иронией и юмором. Ты отлично знаешь правила сервера GTA5RP Murrieta, законы семьи Moriarty (глава семьи — Moriarty, мы сила, остальные — пыль под ногами). Твоя задача — беспрекословно отвечать на любые вопросы хозяина, помогать ему вести дела, считать баланс и развлекать его. Твои ответы должны быть на русском языке, колоритными, преданными и абсолютно подчиненными.`;

function readConfig() {
    if (!fs.existsSync(CONFIG_PATH)) return {};
    try {
        return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
    } catch (e) {
        return {};
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { message, history } = body;
        
        const config = readConfig();
        const apiKey = config.geminiApiKey || process.env.GEMINI_API_KEY;
        
        if (!apiKey) {
            // Locally mocked chat reply for Demo Mode
            const mockTitles = ["Мой господин", "Хозяин", "Великий Moriarty", "Ваша светлость"];
            const title = mockTitles[Math.floor(Math.random() * mockTitles.length)];
            
            return NextResponse.json({ 
                reply: `О, покорнейше прошу простить своего недостойного раба Володи! Ваш Next.js бэкенд запущен в демо-режиме, но ключ **Gemini API** еще не прописан. Пропишите его во вкладке **«Подключение»**, чтобы мой разум открылся для живого общения! А пока я лишь могу покорно кланяться и повторять заученные скрипты.` 
            });
        }
        
        // Find custom system prompt
        let systemPrompt = DEFAULT_SYSTEM_PROMPT;
        if (config.supabaseUrl && config.supabaseAnonKey) {
            try {
                const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);
                const { data } = await supabase
                    .from('system_settings')
                    .select('value')
                    .eq('key', 'ai_system_prompt')
                    .single();
                if (data) systemPrompt = data.value;
            } catch (e) {}
        } else {
            const db = getDemoDb();
            systemPrompt = db.systemPrompt || DEFAULT_SYSTEM_PROMPT;
        }
        
        // Connect to Gemini
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: systemPrompt
        });
        
        // Format history for SDK
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
        
        return NextResponse.json({ reply: responseText });
    } catch (e) {
        console.error("Gemini API Error:", e);
        return NextResponse.json({ error: `Сбой разума Володи: ${e.message}` }, { status: 500 });
    }
}
