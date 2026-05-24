'use client';

import React, { useState, useEffect, useRef } from 'react';

export default function StreamerCabinet() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [toasts, setToasts] = useState([]);
    
    // Module 1: Anti-Streamsnipe States
    const [obsConnected, setObsConnected] = useState(true);
    const [blurActive, setBlurActive] = useState(false);
    const [fakeInfoActive, setFakeInfoActive] = useState(false);
    const [fakeData, setFakeData] = useState({
        charName: 'Arthur_Toretto',
        cid: '12485',
        location: 'Sandy Shores, Сектор C-5',
        faction: 'The Families'
    });
    
    // Module 2: Live RP Stats States
    const [trashCounter, setTrashCounter] = useState(0);
    const [obsPort, setObsPort] = useState('4455');
    const [obsHost, setObsHost] = useState('localhost');
    
    // Module 3: Combined Multi-Chat States
    const [chatMessages, setChatMessages] = useState([]);
    const [moderationLogs, setModerationLogs] = useState([]);
    const chatEndRef = useRef(null);
    
    // Module 4: Discord Webhook States
    const [discordWebhook, setDiscordWebhook] = useState('');
    const [streamTitle, setStreamTitle] = useState('Апокалипсис в Лос-Сантосе! Мориарти выходит на охоту!');
    const [streamDesc, setStreamDesc] = useState('Залетайте на стрим! Сегодня чистим город от фриков, берем под полный контроль особняк и раздаем бабло новичкам.');
    const [announcementStatus, setAnnouncementStatus] = useState('idle'); // idle, sending, success

    const addToast = (text, type = "info") => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts(prev => [...prev, { id, text, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 4000);
    };

    // Load active session
    useEffect(() => {
        const storedUser = localStorage.getItem('moriarty_user');
        if (storedUser) {
            try {
                const parsed = JSON.parse(storedUser);
                setUser(parsed);
                if (parsed.is_media) {
                    setTrashCounter(parsed.media_trash_counter || 0);
                    if (parsed.streamer_settings) {
                        setObsHost(parsed.streamer_settings.obs_host || 'localhost');
                        setObsPort(parsed.streamer_settings.obs_port || '4455');
                        setDiscordWebhook(parsed.streamer_settings.discord_webhook || '');
                        if (parsed.streamer_settings.announcement_title) {
                            setStreamTitle(parsed.streamer_settings.announcement_title);
                        }
                        if (parsed.streamer_settings.announcement_desc) {
                            setStreamDesc(parsed.streamer_settings.announcement_desc);
                        }
                    }
                }
            } catch (e) {
                console.error("Error parsing stored user session", e);
            }
        }
        setLoading(false);
    }, []);

    // Simulated Chat Messages Generator
    useEffect(() => {
        if (!user || !user.is_media) return;

        const firstNames = ['Alexander', 'Dmitry', 'Ivan', 'Sergey', 'Mihail', 'Narek', 'John', 'Vova', 'Artem', 'Nikita'];
        const lastNames = ['Moriarty', 'Toretto', 'Freak', 'Boss', 'Gamer', 'RP', 'Murrieta', 'Rich', 'Stalker', 'Storm'];
        const messages = [
            "Где стрим идет?", "Какая фракция сегодня?", "Ты фрик или босс?", "Сколько денег в казне?",
            "Жесткий онлайн!", "Мориарти топ!", "Шакур лох чисто зашел поорать", "Опять стримснайперы приехали",
            "Куда едем дальше?", "Где особняк синдиката?", "Покажи баланс сейфа!", "Нищий стример с читами",
            "Респект за RP контент!", "Как вступить в семью?", "Володя ИИ топ помощник", "Залей жалобу на форум"
        ];
        
        // Initial set of chat messages
        const initialChats = Array.from({ length: 6 }).map(() => {
            const isTwitch = Math.random() > 0.5;
            const author = `${firstNames[Math.floor(Math.random() * firstNames.length)]}_${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
            const text = messages[Math.floor(Math.random() * messages.length)];
            const isToxic = checkToxicity(text);
            return {
                id: Math.random().toString(36).substring(2, 9),
                platform: isTwitch ? 'twitch' : 'youtube',
                author,
                text,
                isToxic,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
            };
        });
        setChatMessages(initialChats);

        // Interval to stream comments
        const interval = setInterval(() => {
            const isTwitch = Math.random() > 0.5;
            const author = `${firstNames[Math.floor(Math.random() * firstNames.length)]}_${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
            const text = messages[Math.floor(Math.random() * messages.length)];
            const isToxic = checkToxicity(text);
            
            const newMsg = {
                id: Math.random().toString(36).substring(2, 9),
                platform: isTwitch ? 'twitch' : 'youtube',
                author,
                text,
                isToxic,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
            };

            setChatMessages(prev => [...prev.slice(-25), newMsg]);
            
            if (isToxic) {
                setModerationLogs(prev => [
                    { id: newMsg.id, author: newMsg.author, reason: "Нецензурная лексика / Токсичность (ИИ)", text: newMsg.text, action: "BLOCKED", time: newMsg.timestamp },
                    ...prev.slice(0, 15)
                ]);
            }
        }, 4000);

        return () => clearInterval(interval);
    }, [user]);

    // Simulated Fake Info Generator Interval
    useEffect(() => {
        if (!fakeInfoActive) return;
        
        const locs = [
            'Sandy Shores, Сектор C-5', 'Paleto Bay, Сектор A-2', 'Mirror Park, Сектор E-12',
            'Chiliad Mountain, Сектор B-1', 'Los Santos Airport, Сектор F-18', 'Vespucci Beach, Сектор E-6'
        ];
        const factions = ['The Families', 'Ballas', 'Vagos', 'Marabunta', 'LSPD', 'FIB'];
        const names = ['Arthur_Toretto', 'John_Wick', 'Dmitry_Shakur', 'Narek_Rich', 'Vova_Buster'];
        
        const interval = setInterval(() => {
            setFakeData({
                charName: names[Math.floor(Math.random() * names.length)],
                cid: Math.floor(Math.random() * 80000 + 10000).toString(),
                location: locs[Math.floor(Math.random() * locs.length)],
                faction: factions[Math.floor(Math.random() * factions.length)]
            });
        }, 6000);

        return () => clearInterval(interval);
    }, [fakeInfoActive]);

    // Toxicity evaluator
    const checkToxicity = (text) => {
        const toxicWords = ['лох', 'нищий', 'чит', 'токсик', 'урод', 'даун', 'пидор', 'сука', 'бля', 'крип'];
        const normalized = text.toLowerCase();
        return toxicWords.some(word => normalized.includes(word));
    };

    // Auto-scroll chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    // Action: Save custom settings
    const saveStreamerSettings = async (updatedSettings, updatedTrash = trashCounter) => {
        if (!user) return;
        
        try {
            const res = await fetch('/api/db', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'updateStreamerSettings',
                    userId: user.id,
                    streamerSettings: {
                        obs_host: obsHost,
                        obs_port: obsPort,
                        discord_webhook: discordWebhook,
                        announcement_title: streamTitle,
                        announcement_desc: streamDesc,
                        ...updatedSettings
                    },
                    mediaTrashCounter: updatedTrash
                })
            });
            
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to save settings");
            
            // Sync local storage
            const updatedUser = {
                ...user,
                media_trash_counter: updatedTrash,
                streamer_settings: {
                    obs_host: obsHost,
                    obs_port: obsPort,
                    discord_webhook: discordWebhook,
                    announcement_title: streamTitle,
                    announcement_desc: streamDesc,
                    ...updatedSettings
                }
            };
            localStorage.setItem('moriarty_user', JSON.stringify(updatedUser));
            setUser(updatedUser);
        } catch (err) {
            addToast(err.message, "error");
        }
    };

    // Increment recycled freaks counter
    const handleRecycleFreak = () => {
        const nextVal = trashCounter + 1;
        setTrashCounter(nextVal);
        saveStreamerSettings({}, nextVal);
        addToast("Счетчик фриков обновлен! (+1 Уволен)", "success");
    };

    // Reset trash counter
    const handleResetRecycle = () => {
        setTrashCounter(0);
        saveStreamerSettings({}, 0);
        addToast("Счетчик фриков сброшен", "info");
    };

    // Webhook simulation post
    const handlePostAnnouncement = async (e) => {
        e.preventDefault();
        setAnnouncementStatus('sending');
        
        // Simulating webhook delay
        setTimeout(() => {
            setAnnouncementStatus('success');
            addToast("Анонс стрима успешно разослан в Discord и Telegram!", "success");
            saveStreamerSettings({});
            setTimeout(() => setAnnouncementStatus('idle'), 3000);
        }, 1500);
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0B0B0F', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                <div style={{ textAlign: 'center' }}>
                    <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: '3rem', color: '#E5D3B3', marginBottom: '1.5rem' }}></i>
                    <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: '500' }}>Анализ медиа-прав доступа...</h2>
                </div>
            </div>
        );
    }

    if (!user || !user.is_media) {
        return (
            <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0B0B0F', alignItems: 'center', justifyContent: 'center', color: '#fff', padding: '2rem' }}>
                <div className="cyber-panel" style={{ maxWidth: '500px', textAlign: 'center', border: '1px solid #C24141' }}>
                    <i className="fa-solid fa-lock" style={{ fontSize: '4rem', color: '#C24141', marginBottom: '1.5rem' }}></i>
                    <h1 style={{ fontSize: '1.6rem', fontWeight: '700', marginBottom: '1rem', textTransform: 'uppercase' }}>В доступе отказано!</h1>
                    <p style={{ color: '#8E8E96', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                        Этот раздел предназначен исключительно для официальных медиа-партнеров синдиката Moriarty. 
                        Для получения доступа обратитесь к главе семьи или техническому администратору.
                    </p>
                    <a href="/" className="btn-secondary" style={{ width: '100%' }}>Вернуться в кабинет</a>
                </div>
            </div>
        );
    }

    // Get live Browser Source URL
    const overlayUrl = typeof window !== 'undefined' 
        ? `${window.location.origin}/streamer-cabinet/overlay?userId=${user.id}` 
        : `/streamer-cabinet/overlay?userId=${user.id}`;

    return (
        <div style={{ backgroundColor: '#0B0B0F', minHeight: '100vh', color: '#fff', position: 'relative' }}>
            {/* Header Area */}
            <header className="main-header" style={{ margin: '1.5rem', marginBottom: '0' }}>
                <div className="header-title-wrap">
                    <h1 className="brand-text" style={{ fontSize: '1.6rem', letterSpacing: '1px' }}>
                        <i className="fa-solid fa-tower-broadcast" style={{ marginRight: '10px' }}></i>
                        Кабинет Стримера
                    </h1>
                    <p>Syndicate Media Partner Suite & OBS Integration</p>
                </div>
                <div className="hud-actions-right">
                    <span className="server-badge" style={{ border: '1px solid var(--primary-neon)', color: 'var(--primary-neon)' }}>
                        Media Account: {user.character_name}
                    </span>
                    <div className="connection-status">
                        <span className="status-dot animate-pulse"></span>
                        OBS WebSocket: {obsConnected ? 'Connected (Simulated)' : 'Disconnected'}
                    </div>
                </div>
            </header>

            {/* Core Panels Grid */}
            <main className="app-container" style={{ paddingTop: '1.5rem' }}>
                {/* Left Column: Visual Protectors & HUD Settings */}
                <div style={{ flex: '1.2', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    
                    {/* Viewport Live Simulation */}
                    <section className="cyber-panel">
                        <h2 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1rem', textTransform: 'uppercase', color: 'var(--primary-neon)' }}>
                            <i className="fa-solid fa-eye" style={{ marginRight: '8px' }}></i>
                            Стрим-Монитор (Simulated Viewport)
                        </h2>
                        
                        <div className="streamer-viewport-wrapper">
                            {/* Live video placeholder image */}
                            <img 
                                src="https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1470&auto=format&fit=crop" 
                                alt="RP Game Feed" 
                                className={`streamer-feed-sim ${blurActive ? 'blurred' : ''}`}
                            />
                            
                            {/* Overlay Blur Placards */}
                            {blurActive && (
                                <div style={{ position: 'absolute', top: '15px', right: '15px', backgroundColor: 'rgba(194, 65, 65, 0.95)', border: '1px solid #fff', color: '#fff', padding: '6px 12px', borderRadius: '4px', fontSize: '0.72rem', fontFamily: 'Space Grotesk', fontWeight: 'bold' }}>
                                    <i className="fa-solid fa-mask" style={{ marginRight: '6px' }}></i>
                                    HUD И РАДАР ЗАБЛОКИРОВАНЫ
                                </div>
                            )}

                            {/* Fake Overlay Injector Box */}
                            {fakeInfoActive && (
                                <div className="streamer-overlay-banner animate-pulse">
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Текущие координаты (Фейк)</span>
                                        <span style={{ fontSize: '0.82rem', fontWeight: 'bold', color: 'var(--primary-neon)' }}>
                                            <i className="fa-solid fa-compass" style={{ marginRight: '5px' }}></i>
                                            {fakeData.location}
                                        </span>
                                    </div>
                                    <div style={{ width: '1px', height: '24px', backgroundColor: 'rgba(255, 255, 255, 0.15)' }}></div>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Активный Персонаж</span>
                                        <span style={{ fontSize: '0.82rem', fontWeight: 'bold' }}>
                                            {fakeData.charName} (CID: {fakeData.cid})
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Module 1: Anti-Streamsnipe Controls */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.5rem' }}>
                            <div className="glass-panel" style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <div className="toggle-switch-container">
                                    <label className="switch">
                                        <input 
                                            type="checkbox" 
                                            checked={blurActive} 
                                            onChange={(e) => setBlurActive(e.target.checked)} 
                                        />
                                        <span className="slider"></span>
                                    </label>
                                    <div className="switch-label-wrap">
                                        <span className="switch-title">Умное размытие худа</span>
                                        <span className="switch-desc">Мгновенный блюр карты/радара по хоткею</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="glass-panel" style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <div className="toggle-switch-container">
                                    <label className="switch">
                                        <input 
                                            type="checkbox" 
                                            checked={fakeInfoActive} 
                                            onChange={(e) => setFakeInfoActive(e.target.checked)} 
                                        />
                                        <span className="slider"></span>
                                    </label>
                                    <div className="switch-label-wrap">
                                        <span className="switch-title">Инжектор фейк-координат</span>
                                        <span className="switch-desc">Вывод ложного местоположения стримснайперам</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Module 2: Live RP Statistics (Overlay builder) */}
                    <section className="cyber-panel">
                        <h2 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1.2rem', textTransform: 'uppercase', color: 'var(--primary-neon)' }}>
                            <i className="fa-solid fa-clock-rotate-left" style={{ marginRight: '8px' }}></i>
                            Кастомный Live-оверлей (OBS Browser Source)
                        </h2>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                            <div className="form-group">
                                <label>Ссылка для OBS Browser Source</label>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input 
                                        type="text" 
                                        readOnly 
                                        className="form-control" 
                                        value={overlayUrl} 
                                        style={{ fontFamily: 'Space Grotesk', fontSize: '0.82rem', background: '#000', color: 'var(--primary-neon)' }} 
                                    />
                                    <button 
                                        type="button" 
                                        className="btn-primary" 
                                        onClick={() => {
                                            navigator.clipboard.writeText(overlayUrl);
                                            addToast("Ссылка скопирована в буфер обмена!", "success");
                                        }}
                                    >
                                        <i className="fa-solid fa-copy"></i>
                                    </button>
                                </div>
                            </div>

                            {/* Recycled Freaks Counter Dashboard Panel */}
                            <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Утилизировано фриков на стриме</span>
                                    <h3 style={{ fontSize: '2.2rem', fontFamily: 'Space Grotesk', fontWeight: '700', color: '#fff' }}>
                                        {trashCounter} <span style={{ fontSize: '0.95rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>персонажей</span>
                                    </h3>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button 
                                        type="button" 
                                        className="btn-primary" 
                                        onClick={handleRecycleFreak} 
                                        style={{ height: '48px', padding: '0 24px' }}
                                    >
                                        <i className="fa-solid fa-user-slash" style={{ marginRight: '8px' }}></i>
                                        +1 Уволен (!уволен)
                                    </button>
                                    <button 
                                        type="button" 
                                        className="btn-secondary" 
                                        onClick={handleResetRecycle}
                                        style={{ height: '48px', color: 'var(--accent-rose)', border: '1px solid rgba(194,65,65,0.2)' }}
                                        title="Сбросить счетчик"
                                    >
                                        <i className="fa-solid fa-arrows-rotate"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>

                </div>

                {/* Right Column: Multi-Chat consolidator & Discord announcer */}
                <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    
                    {/* Module 3: Combined Multi-Chat Monitor */}
                    <section className="cyber-panel">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                            <h2 style={{ fontSize: '1.1rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--primary-neon)' }}>
                                <i className="fa-solid fa-comments" style={{ marginRight: '8px' }}></i>
                                Консолидированный чат трансляции
                            </h2>
                            <span className="slave-badge" style={{ background: 'rgba(255,255,255,0.05)', color: '#fff' }}>
                                Модерация ИИ: Активна
                            </span>
                        </div>
                        
                        {/* Live Chat list */}
                        <div className="live-chat-panel">
                            <div className="live-chat-scroller">
                                {chatMessages.map((msg) => (
                                    <div key={msg.id} className={`stream-chat-msg ${msg.isToxic ? 'toxic' : ''}`}>
                                        <span className={`stream-platform-icon ${msg.platform}`}>
                                            <i className={`fa-brands fa-${msg.platform}`}></i>
                                        </span>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'Space Grotesk' }}>[{msg.timestamp}]</span>
                                        <span className="stream-chat-author">{msg.author}:</span>
                                        <span className="stream-chat-text">{msg.text}</span>
                                        {msg.isToxic && (
                                            <span className="toxic-badge">Блок ИИ</span>
                                        )}
                                    </div>
                                ))}
                                <div ref={chatEndRef} />
                            </div>
                        </div>

                        {/* Toxicity Log Summary snippet */}
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '1rem', padding: '10px', background: 'rgba(194, 65, 65, 0.05)', borderRadius: '6px', border: '1px solid rgba(194, 65, 65, 0.15)', fontSize: '0.8rem' }}>
                            <i className="fa-solid fa-circle-exclamation" style={{ color: 'var(--accent-rose)' }}></i>
                            <span style={{ color: '#fff' }}>
                                <strong>ИИ Фильтр:</strong> Автоматически скрыто спамеров и токсичных фриков: {moderationLogs.length}
                            </span>
                        </div>
                    </section>

                    {/* Module 4: Enterprise Discord Webhook Announcer */}
                    <section className="cyber-panel">
                        <h2 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1.2rem', textTransform: 'uppercase', color: 'var(--primary-neon)' }}>
                            <i className="fa-brands fa-discord" style={{ marginRight: '8px' }}></i>
                            Enterprise Discord-Анонсер
                        </h2>
                        
                        <form onSubmit={handlePostAnnouncement} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div className="form-group">
                                <label>Discord Webhook URL</label>
                                <input 
                                    type="url" 
                                    className="form-control" 
                                    placeholder="https://discord.com/api/webhooks/..." 
                                    value={discordWebhook}
                                    onChange={(e) => setDiscordWebhook(e.target.value)}
                                />
                            </div>

                            <div className="form-group">
                                <label>Заголовок оповещения</label>
                                <input 
                                    type="text" 
                                    className="form-control" 
                                    placeholder="Стрим запущен!" 
                                    value={streamTitle}
                                    onChange={(e) => setStreamTitle(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Текст описания анонса</label>
                                <textarea 
                                    rows="3" 
                                    className="form-control" 
                                    placeholder="Описание стрима..." 
                                    value={streamDesc}
                                    onChange={(e) => setStreamDesc(e.target.value)}
                                    required
                                />
                            </div>

                            <button 
                                type="submit" 
                                className="btn-primary" 
                                disabled={announcementStatus === 'sending' || !discordWebhook} 
                                style={{ width: '100%', height: '45px', marginTop: '5px' }}
                            >
                                {announcementStatus === 'sending' ? (
                                    <>
                                        <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>
                                        Рассылка богатых эмбедов...
                                    </>
                                ) : announcementStatus === 'success' ? (
                                    <>
                                        <i className="fa-solid fa-circle-check" style={{ marginRight: '8px' }}></i>
                                        Анонс успешно отправлен!
                                    </>
                                ) : (
                                    <>
                                        <i className="fa-solid fa-paper-plane" style={{ marginRight: '8px' }}></i>
                                        Запустить трансляцию (Анонс)
                                    </>
                                )}
                            </button>
                        </form>
                    </section>
                </div>
            </main>

            {/* Sleek Custom Toaster alerts */}
            <div style={{ position: 'fixed', bottom: '20px', right: '20px', display: 'flex', flexDirection: 'column', gap: '8px', zIndex: '9999' }}>
                {toasts.map(t => (
                    <div 
                        key={t.id} 
                        style={{ 
                            padding: '12px 18px', 
                            borderRadius: '8px', 
                            background: t.type === 'error' ? '#C24141' : '#16161E', 
                            border: t.type === 'success' ? '1px solid rgba(229,211,179,0.3)' : '1px solid rgba(255,255,255,0.06)', 
                            color: '#fff', 
                            fontSize: '0.85rem', 
                            boxShadow: '0 5px 15px rgba(0,0,0,0.5)', 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '10px',
                            animation: 'cyberSpringSlide 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
                        }}
                    >
                        {t.type === 'success' ? (
                            <i className="fa-solid fa-circle-check" style={{ color: 'var(--primary-neon)' }}></i>
                        ) : t.type === 'error' ? (
                            <i className="fa-solid fa-circle-xmark" style={{ color: '#fff' }}></i>
                        ) : (
                            <i className="fa-solid fa-circle-info" style={{ color: 'var(--text-muted)' }}></i>
                        )}
                        {t.text}
                    </div>
                ))}
            </div>
        </div>
    );
}
