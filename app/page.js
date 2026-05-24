"use client";

import React, { useState, useEffect, useRef } from 'react';

export default function Home() {
    // Auth & Navigation states
    const [user, setUser] = useState(null);
    const [authMode, setAuthMode] = useState('login');
    const [activeTab, setActiveTab] = useState('stats');
    const [settingsSubTab, setSettingsSubTab] = useState('account');
    
    // Auth Form Input States
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [charName, setCharName] = useState('');
    const [staticId, setStaticId] = useState('');
    const [referral, setReferral] = useState('');
    
    // Account Settings states
    const [newEmail, setNewEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    // Custom Confirmation Dialog system
    const [customConfirm, setCustomConfirm] = useState({
        show: false,
        title: '',
        message: '',
        onConfirm: null,
        confirmText: 'Подтвердить',
        cancelText: 'Отмена'
    });
    
    // UI Helpers & TOAST SYSTEM
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [toasts, setToasts] = useState([]);
    
    // Reactive Cabinet Data States
    const [profile, setProfile] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [warns, setWarns] = useState([]);
    const [feedbackList, setFeedbackList] = useState([]);
    const [referrals, setReferrals] = useState([]);
    
    // Connections / Settings Config States
    const [config, setConfig] = useState({
        supabaseUrl: '',
        supabaseAnonKey: '',
        geminiApiKey: '',
        discordClientId: '',
        discordClientSecret: ''
    });
    const [isSupabaseMode, setIsSupabaseMode] = useState(false);
    const [hasGeminiKey, setHasGeminiKey] = useState(false);
    
    // AI Volodya Chat States
    const [chatMessages, setChatMessages] = useState([
        {
            id: 'init-msg',
            role: 'model',
            text: 'Повинуюсь и преклоняюсь перед великой семьей Moriarty! Я — твой верный личный раб Володя, готовый исполнить любое твое повеление на сервере GTA5RP Murrieta. Чем могу служить своему хозяину сегодня?',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
    ]);
    const [chatInput, setChatInput] = useState('');
    const [chatLoading, setChatLoading] = useState(false);
    const messagesEndRef = useRef(null);
    
    // Balance Action Form States
    const [depositAmount, setDepositAmount] = useState('');
    const [transferAmount, setTransferAmount] = useState('');
    const [transferTargetCid, setTransferTargetCid] = useState('');
    
    // Feedback Form States
    const [feedbackType, setFeedbackType] = useState('SUGGESTION'); // SUGGESTION or COMPLAINT
    const [feedbackTarget, setFeedbackTarget] = useState('');
    const [feedbackText, setFeedbackText] = useState('');
    
    // Modals
    const [showDepositModal, setShowDepositModal] = useState(false);
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [showAvatarModal, setShowAvatarModal] = useState(false);
    const [customAvatarUrl, setCustomAvatarUrl] = useState('');
    
    // Admin Section States
    const [adminUsers, setAdminUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedAdminUser, setSelectedAdminUser] = useState(null);
    
    // Admin Edit Form States
    const [editRole, setEditRole] = useState('MEMBER');
    const [editWarns, setEditWarns] = useState(0);
    const [editBalance, setEditBalance] = useState(0);
    const [editIsMedia, setEditIsMedia] = useState(false);
    const [systemPrompt, setSystemPrompt] = useState('');
    
    // Mobile navigation state
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // 2026 Faction features: Treasury, PC photo upload, flexible Warnings & Feedback
    const [treasuryRequests, setTreasuryRequests] = useState([]);
    const [showTreasuryRequestModal, setShowTreasuryRequestModal] = useState(false);
    const [reqAmount, setReqAmount] = useState('');
    const [reqType, setReqType] = useState('DEPOSIT');
    const [reqDescription, setReqDescription] = useState('');

    const [allFeedbacks, setAllFeedbacks] = useState([]);
    const [adminReplyText, setAdminReplyText] = useState('');
    const [warnReason, setWarnReason] = useState('');
    const [adminTreasuryComment, setAdminTreasuryComment] = useState('');
    const [selectedUserWarns, setSelectedUserWarns] = useState([]);
    const [adminSubTab, setAdminSubTab] = useState('users');

    // Streamer Cabinet states
    const [obsConnected, setObsConnected] = useState(true);
    const [blurActive, setBlurActive] = useState(false);
    const [fakeInfoActive, setFakeInfoActive] = useState(false);
    const [fakeData, setFakeData] = useState({
        charName: 'Arthur_Toretto',
        cid: '12485',
        location: 'Sandy Shores, Сектор C-5',
        faction: 'The Families'
    });
    const [trashCounter, setTrashCounter] = useState(0);
    const [obsPort, setObsPort] = useState('4455');
    const [obsHost, setObsHost] = useState('localhost');
    const [discordWebhook, setDiscordWebhook] = useState('');
    const [streamTitle, setStreamTitle] = useState('Апокалипсис в Лос-Сантосе! Мориарти выходит на охоту!');
    const [streamDesc, setStreamDesc] = useState('Залетайте на стрим! Сегодня чистим город от фриков, берем под полный контроль особняк и раздаем бабло новичкам.');
    const [announcementStatus, setAnnouncementStatus] = useState('idle'); // idle, sending, success
    const [streamChatMessages, setStreamChatMessages] = useState([]);
    const [streamModerationLogs, setStreamModerationLogs] = useState([]);
    const [twitchChannel, setTwitchChannel] = useState('');
    const [isTwitchConnected, setIsTwitchConnected] = useState(false);
    const twitchWsRef = useRef(null);
    const chatEndRef = useRef(null);




    // Connect to real-time Twitch Chat via standard Twitch IRC WebSocket (Client-side)
    const connectToTwitch = (channelName) => {
        if (!channelName.trim()) {
            addToast("Введите корректное имя канала Twitch!", "error");
            return;
        }

        const channel = channelName.trim().toLowerCase();

        // 1. Clean up existing WebSocket if any
        if (twitchWsRef.current) {
            try {
                twitchWsRef.current.close();
            } catch (e) {}
            twitchWsRef.current = null;
        }

        setIsTwitchConnected(false);
        setTwitchChannel(channel);

        // Add system message
        const startMsg = {
            id: 'sys-' + Math.random().toString(36).substr(2, 9),
            platform: 'twitch',
            author: 'Система',
            text: `Подключение к реальному чату Twitch канала #${channel}...`,
            isToxic: false,
            isSystem: true,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        };
        setStreamChatMessages([startMsg]);

        try {
            // 2. Open anonymous Twitch IRC WebSocket
            const ws = new WebSocket('wss://irc-ws.chat.twitch.tv:443');
            twitchWsRef.current = ws;

            ws.onopen = () => {
                // Anonymous handshake
                ws.send('CAP REQ :twitch.tv/tags twitch.tv/commands twitch.tv/membership');
                ws.send('PASS oauth:anonymous');
                const randomNum = Math.floor(10000 + Math.random() * 90000);
                ws.send(`NICK justinfan${randomNum}`);
                ws.send(`JOIN #${channel}`);
            };

            ws.onmessage = (event) => {
                const rawData = event.data;
                
                // Handle PING from Twitch server to keep connection alive
                if (rawData.startsWith('PING')) {
                    ws.send('PONG :tmi.twitch.tv');
                    return;
                }

                // Handle PRIVMSG (standard Twitch chat message)
                if (rawData.includes('PRIVMSG')) {
                    let displayName = '';
                    let messageText = '';
                    
                    // Extract display-name from tags
                    const displayNameMatch = rawData.match(/display-name=([^;]+)/);
                    if (displayNameMatch && displayNameMatch[1]) {
                        displayName = displayNameMatch[1];
                    }

                    // Extract nickname as fallback from :nickname!
                    if (!displayName) {
                        const nickMatch = rawData.match(/:([^!]+)!/);
                        if (nickMatch && nickMatch[1]) {
                            displayName = nickMatch[1];
                        }
                    }

                    // Extract message content: everything after "PRIVMSG #channel :"
                    const privmsgMarker = `PRIVMSG #${channel} :`;
                    const index = rawData.indexOf(privmsgMarker);
                    if (index !== -1) {
                        messageText = rawData.substring(index + privmsgMarker.length).trim();
                    }

                    if (displayName && messageText) {
                        // Toxicity check
                        const toxicWords = ['лох', 'нищий', 'чит', 'токсик', 'урод', 'даун', 'пидор', 'сука', 'бля', 'крип', 'freak', 'fucking', 'trash'];
                        const isToxic = toxicWords.some(word => messageText.toLowerCase().includes(word));
                        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

                        const newMsg = {
                            id: Math.random().toString(36).substr(2, 9),
                            platform: 'twitch',
                            author: displayName,
                            text: messageText,
                            isToxic,
                            timestamp
                        };

                        setStreamChatMessages(prev => [...prev.slice(-39), newMsg]);

                        if (isToxic) {
                            setStreamModerationLogs(prev => [
                                { 
                                    id: newMsg.id, 
                                    author: newMsg.author, 
                                    reason: "Токсичность / Оскорбление (ИИ модерация)", 
                                    text: newMsg.text, 
                                    action: "BLOCKED", 
                                    time: newMsg.timestamp 
                                },
                                ...prev.slice(0, 19)
                            ]);
                        }
                    }
                } else if (rawData.includes('JOIN')) {
                    // Successfully joined channel
                    setIsTwitchConnected(true);
                    addToast(`Чат Twitch #${channel} успешно подключен!`, "success");
                    
                    setStreamChatMessages(prev => [
                        ...prev,
                        {
                            id: 'sys-' + Math.random().toString(36).substr(2, 9),
                            platform: 'twitch',
                            author: 'Система',
                            text: `Успешное соединение с Twitch каналом #${channel}! Чат транслируется в реальном времени.`,
                            isToxic: false,
                            isSystem: true,
                            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                        }
                    ]);
                }
            };

            ws.onerror = (err) => {
                console.error("Twitch WS Error:", err);
                setIsTwitchConnected(false);
                addToast("Ошибка соединения с Twitch IRC", "error");
            };

            ws.onclose = () => {
                setIsTwitchConnected(false);
            };

        } catch (e) {
            console.error("Twitch Connection Exception:", e);
            setIsTwitchConnected(false);
        }
    };

    const disconnectTwitch = () => {
        if (twitchWsRef.current) {
            try {
                twitchWsRef.current.close();
            } catch (e) {}
            twitchWsRef.current = null;
        }
        setIsTwitchConnected(false);
        addToast("Чат Twitch отключен", "info");
        
        setStreamChatMessages(prev => [
            ...prev,
            {
                id: 'sys-' + Math.random().toString(36).substr(2, 9),
                platform: 'twitch',
                author: 'Система',
                text: `Чат Twitch отключен пользователем.`,
                isToxic: false,
                isSystem: true,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
            }
        ]);
    };

    // Recycled freaks helper functions
    const handleRecycleFreak = () => {
        const nextVal = trashCounter + 1;
        setTrashCounter(nextVal);
        saveStreamerSettings({}, nextVal);
        addToast("Счетчик фриков обновлен! (+1 Уволен)", "success");
    };

    const handleResetRecycle = () => {
        setTrashCounter(0);
        saveStreamerSettings({}, 0);
        addToast("Счетчик фриков сброшен", "info");
    };

    // Enterprise Webhook Scheduler Mock
    const handlePostAnnouncement = async (e) => {
        e.preventDefault();
        setAnnouncementStatus('sending');
        setTimeout(() => {
            setAnnouncementStatus('success');
            addToast("Анонс стрима успешно разослан в Discord!", "success");
            saveStreamerSettings({});
            setTimeout(() => setAnnouncementStatus('idle'), 3000);
        }, 1500);
    };

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

    // WebSocket cleanup and chat scrolling hooks
    useEffect(() => {
        return () => {
            if (twitchWsRef.current) {
                try { twitchWsRef.current.close(); } catch (e) {}
            }
        };
    }, []);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [streamChatMessages]);

    // Toast Add Helper
    const addToast = (msg, type = 'success') => {
        const id = 'toast-' + Math.random().toString(36).substr(2, 9);
        setToasts(prev => [...prev, { id, msg, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3800);
    };

    // Custom Confirmation Dialog Helper
    const triggerConfirm = (title, message, onConfirm, confirmText = 'Подтвердить', cancelText = 'Отмена') => {
        setCustomConfirm({
            show: true,
            title,
            message,
            onConfirm: () => {
                onConfirm();
                setCustomConfirm(prev => ({ ...prev, show: false }));
            },
            confirmText,
            cancelText
        });
    };

    // Trigger real Discord OAuth binding flow
    const handleLinkDiscord = () => {
        if (!config.discordClientId) {
            addToast("Настройки Discord OAuth2 не заданы на сервере!", "error");
            return;
        }
        
        const clientId = config.discordClientId;
        const redirectUri = encodeURIComponent(window.location.origin + '/');
        const state = `BIND:${user.id}`;
        
        window.location.href = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=identify&state=${state}`;
    };

    // Unlink Discord connection
    const handleUnlinkDiscord = async () => {
        triggerConfirm(
            "Отвязка аккаунта Discord",
            "Вы действительно хотите отвязать вашу учетную запись Discord от этого кабинета? Вы больше не сможете входить с ее помощью, пока не привяжете заново.",
            async () => {
                setLoading(true);
                try {
                    const res = await fetch('/api/db', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            action: 'unlinkDiscord',
                            userId: user.id
                        })
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || "Failed to unlink Discord");
                    
                    addToast("Учетная запись Discord успешно отвязана от кабинета!", "success");
                    refreshUserData(user.id);
                } catch (err) {
                    addToast(err.message, "error");
                } finally {
                    setLoading(false);
                }
            },
            "Отвязать Discord",
            "Отмена"
        );
    };

    // Process real Discord OAuth code and state callback
    const handleDiscordCallback = async (code, state) => {
        setLoading(true);
        addToast("Связывание с серверами Discord...", "info");
        try {
            const redirectUri = window.location.origin + '/';
            
            const res = await fetch('/api/auth/discord', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    code, 
                    state, 
                    redirectUri 
                })
            });
            
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Discord Auth Exchange failed');
            
            if (state && state.startsWith('BIND:')) {
                addToast("Аккаунт Discord успешно привязан!", "success");
                const boundUid = state.split('BIND:')[1];
                refreshUserData(boundUid);
            } else {
                setUser(data.user);
                setProfile(data.user);
                localStorage.setItem('moriarty_user', JSON.stringify(data.user));
                addToast('Вход через Discord успешно выполнен!', 'success');
                refreshUserData(data.user.id);
            }
        } catch (err) {
            addToast(err.message, "error");
        } finally {
            setLoading(false);
        }
    };

    // Account settings form handlers
    const handleEmailUpdate = async (e) => {
        e.preventDefault();
        if (!newEmail.trim()) return;
        
        triggerConfirm(
            "Смена почтового ящика",
            `Вы действительно хотите изменить электронную почту синдиката на "${newEmail.trim()}"? Это действие обновит ваш мастер-логин для входа в личный кабинет.`,
            async () => {
                setLoading(true);
                try {
                    const res = await fetch('/api/db', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            action: 'changeEmail',
                            userId: user.id,
                            newEmail: newEmail.trim()
                        })
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || "Failed to update email");
                    
                    addToast("Электронная почта синдиката успешно изменена!", "success");
                    setUser(prev => ({ ...prev, email: newEmail.trim() }));
                    setNewEmail('');
                    refreshUserData(user.id);
                } catch (err) {
                    addToast(err.message, "error");
                } finally {
                    setLoading(false);
                }
            },
            "Изменить почту",
            "Отмена"
        );
    };

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        if (!newPassword.trim()) return;
        if (newPassword !== confirmPassword) {
            addToast("Пароли не совпадают!", "error");
            return;
        }
        
        triggerConfirm(
            "Изменение шифра доступа",
            "Вы собираетесь обновить мастер-пароль вашей учетной записи синдиката. Будьте внимательны, это изменит ключ доступа к кабинету! Подтвердить?",
            async () => {
                setLoading(true);
                try {
                    const res = await fetch('/api/db', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            action: 'changePassword',
                            userId: user.id,
                            newPassword: newPassword.trim()
                        })
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || "Failed to update password");
                    
                    addToast("Пароль успешно обновлен в шифрованных базах!", "success");
                    setNewPassword('');
                    setConfirmPassword('');
                } catch (err) {
                    addToast(err.message, "error");
                } finally {
                    setLoading(false);
                }
            },
            "Обновить пароль",
            "Отмена"
        );
    };

    const handleSelfDelete = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/db', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'deleteSelfAccount',
                    userId: user.id
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to delete account");
            
            addToast("Ваш аккаунт удален. Прощайте, Господин...", "info");
            localStorage.removeItem('moriarty_user');
            setUser(null);
            setProfile(null);
        } catch (err) {
            addToast(err.message, "error");
        } finally {
            setLoading(false);
        }
    };

    // Auto-scroll messages
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chatMessages, chatLoading]);

    // Check configuration and active session on load
    useEffect(() => {
        fetchConfig();
        
        const searchParams = new URLSearchParams(window.location.search);
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        
        if (code) {
            window.history.replaceState({}, document.title, window.location.pathname);
            handleDiscordCallback(code, state);
        } else {
            const storedUser = localStorage.getItem('moriarty_user');
            if (storedUser) {
                const parsed = JSON.parse(storedUser);
                setUser(parsed);
                setProfile(parsed);
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
                refreshUserData(parsed.id);
            }
        }
    }, []);

    // Action: Save custom streamer settings
    const saveStreamerSettings = async (updatedSettings, updatedTrash = trashCounter) => {
        if (!activeProfile) return;
        
        try {
            const res = await fetch('/api/db', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'updateStreamerSettings',
                    userId: activeProfile.id,
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
            
            const updatedProfile = {
                ...activeProfile,
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
            setProfile(updatedProfile);
            localStorage.setItem('moriarty_user', JSON.stringify({ ...JSON.parse(localStorage.getItem('moriarty_user') || '{}'), ...updatedProfile }));
        } catch (err) {
            addToast(err.message, "error");
        }
    };

    // Refresh everything for the logged-in user
    const refreshUserData = async (uid) => {
        if (!uid) return;
        try {
            // Get updated profile
            const profileRes = await fetch(`/api/db?action=getProfile&userId=${uid}`);
            if (profileRes.ok) {
                const updatedProfile = await profileRes.json();
                setProfile(updatedProfile);
                
                // Sync streamer parameters if they exist
                if (updatedProfile.is_media) {
                    setTrashCounter(updatedProfile.media_trash_counter || 0);
                    if (updatedProfile.streamer_settings) {
                        setObsHost(updatedProfile.streamer_settings.obs_host || 'localhost');
                        setObsPort(updatedProfile.streamer_settings.obs_port || '4455');
                        setDiscordWebhook(updatedProfile.streamer_settings.discord_webhook || '');
                        if (updatedProfile.streamer_settings.announcement_title) {
                            setStreamTitle(updatedProfile.streamer_settings.announcement_title);
                        }
                        if (updatedProfile.streamer_settings.announcement_desc) {
                            setStreamDesc(updatedProfile.streamer_settings.announcement_desc);
                        }
                    }
                }
                
                // Update local storage representation
                const cached = JSON.parse(localStorage.getItem('moriarty_user') || '{}');
                localStorage.setItem('moriarty_user', JSON.stringify({ ...cached, ...updatedProfile }));
            }
            
            // Get warns
            const warnsRes = await fetch(`/api/db?action=getWarns&userId=${uid}`);
            if (warnsRes.ok) {
                const warnsData = await warnsRes.json();
                setWarns(warnsData);
            }
            
            // Get transactions
            const txRes = await fetch(`/api/db?action=getTransactions&userId=${uid}`);
            if (txRes.ok) {
                const txData = await txRes.json();
                setTransactions(txData);
            }
            
            // Get feedback
            const fbRes = await fetch(`/api/db?action=getFeedback&userId=${uid}`);
            if (fbRes.ok) {
                const fbData = await fbRes.json();
                setFeedbackList(fbData);
            }
            
            // Get referrals
            const refRes = await fetch(`/api/db?action=getReferrals&userId=${uid}`);
            if (refRes.ok) {
                const refData = await refRes.json();
                setReferrals(refData);
            }
            
            // Get treasury requests
            const trRes = await fetch(`/api/db?action=getTreasuryRequests&userId=${uid}`);
            if (trRes.ok) {
                const trData = await trRes.json();
                setTreasuryRequests(trData);
            }
        } catch (e) {
            console.error("Failed to sync cabinet details:", e);
        }
    };

    // Configuration fetching
    const fetchConfig = async () => {
        try {
            const res = await fetch('/api/config');
            if (res.ok) {
                const data = await res.json();
                setIsSupabaseMode(data.isSupabaseMode);
                setHasGeminiKey(data.hasGeminiApiKey);
                setConfig({
                    supabaseUrl: data.supabaseUrl || '',
                    supabaseAnonKey: data.supabaseAnonKeyObfuscated || '',
                    geminiApiKey: data.geminiApiKeyObfuscated || '',
                    discordClientId: data.discordClientId || '',
                    discordClientSecret: ''
                });

                // SELF-HEALING SESSION SANITIZATION
                if (data.isSupabaseMode) {
                    const storedUser = localStorage.getItem('moriarty_user');
                    if (storedUser) {
                        const parsed = JSON.parse(storedUser);
                        const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                        if (parsed.id && !regex.test(parsed.id)) {
                            console.warn("[SELF-HEALING] Invalid demo ID format detected in Supabase Cloud mode. Purging local cache.");
                            localStorage.removeItem('moriarty_user');
                            setUser(null);
                            setProfile(null);
                            addToast("Сессия сброшена для синхронизации с облаком Supabase.", "info");
                        }
                    }
                }
            }
        } catch (e) {
            console.error("Failed to load server config", e);
        }
    };

    // Handle credentials login / signup
    const handleAuth = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);
        
        try {
            const payload = {
                action: authMode,
                email,
                password,
                character_name: charName,
                static_id: staticId,
                referral
            };
            
            const res = await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            const data = await res.json();
            
            if (!res.ok) {
                throw new Error(data.error || 'Ошибка авторизации');
            }
            
            if (authMode === 'login') {
                setUser(data.user);
                setProfile(data.user);
                localStorage.setItem('moriarty_user', JSON.stringify(data.user));
                addToast('С возвращением в семью, Господин!', 'success');
                refreshUserData(data.user.id);
                
                // Clear forms
                setEmail('');
                setPassword('');
            } else {
                addToast(data.message || 'Регистрация успешна! Войдите в личный кабинет.', 'success');
                setAuthMode('login');
                
                // Reset signup values
                setCharName('');
                setStaticId('');
                setReferral('');
            }
        } catch (err) {
            setError(err.message);
            addToast(err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    // Trigger simulated Discord Login (Demo Mode bypass)
    const handleDiscordSimulatedLogin = async () => {
        setError('');
        setSuccess('');
        setLoading(true);
        
        try {
            const res = await fetch('/api/auth/discord', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ simulate: true })
            });
            
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Discord Auth Failure');
            
            setUser(data.user);
            setProfile(data.user);
            localStorage.setItem('moriarty_user', JSON.stringify(data.user));
            addToast('Вход через Discord успешно выполнен!', 'success');
            refreshUserData(data.user.id);
        } catch (err) {
            setError(err.message);
            addToast(err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        addToast('Вы вышли из учетной записи синдиката.', 'info');
        localStorage.removeItem('moriarty_user');
        setUser(null);
        setProfile(null);
        setTransactions([]);
        setWarns([]);
        setFeedbackList([]);
        setReferrals([]);
        setSelectedAdminUser(null);
        setActiveTab('stats');
    };

    // Balance deposit quick submit
    const handleDepositSubmit = async (e) => {
        e.preventDefault();
        const amt = parseFloat(depositAmount);
        if (isNaN(amt) || amt <= 0) {
            addToast("Введите корректную сумму больше нуля!", "error");
            return;
        }
        
        triggerConfirm(
            "Взнос в семейную казну",
            `Вы действительно хотите пополнить общую казну синдиката Moriarty на сумму $${amt.toLocaleString()} из вашего личного сейфа? Это действие необратимо.`,
            async () => {
                setLoading(true);
                try {
                    const res = await fetch('/api/db', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            action: 'deposit',
                            userId: user.id,
                            amount: amt
                        })
                    });
                    
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || "Deposit failed");
                    
                    addToast(`Казна успешно пополнена на $${amt.toLocaleString()}!`, "success");
                    setShowDepositModal(false);
                    setDepositAmount('');
                    refreshUserData(user.id);
                } catch (err) {
                    addToast(err.message, "error");
                } finally {
                    setLoading(false);
                }
            },
            "Внести в казну",
            "Отмена"
        );
    };

    // Balance transfer quick submit
    const handleTransferSubmit = async (e) => {
        e.preventDefault();
        const amt = parseFloat(transferAmount);
        if (isNaN(amt) || amt <= 0) {
            addToast("Введите корректную сумму больше нуля!", "error");
            return;
        }
        if (!transferTargetCid.trim()) {
            addToast("Укажите CID получателя!", "error");
            return;
        }
        
        triggerConfirm(
            "Подтверждение перевода",
            `Вы действительно хотите совершить перевод средств на сумму $${amt.toLocaleString()} для бойца с CID: "${transferTargetCid.trim()}"? Деньги будут списаны с вашего счета немедленно.`,
            async () => {
                setLoading(true);
                try {
                    const res = await fetch('/api/db', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            action: 'transfer',
                            senderId: user.id,
                            targetStaticId: transferTargetCid.trim(),
                            amount: amt
                        })
                    });
                    
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || "Transfer failed");
                    
                    addToast(`Успешно переведено $${amt.toLocaleString()} игроку с CID: ${transferTargetCid}!`, "success");
                    setShowTransferModal(false);
                    setTransferAmount('');
                    setTransferTargetCid('');
                    refreshUserData(user.id);
                } catch (err) {
                    addToast(err.message, "error");
                } finally {
                    setLoading(false);
                }
            },
            "Подтвердить перевод",
            "Отмена"
        );
    };

    // Submit a request to the Treasury (ordinary users)
    const handleTreasuryRequestSubmit = async (e) => {
        e.preventDefault();
        const amt = parseFloat(reqAmount);
        if (isNaN(amt) || amt <= 0) {
            addToast("Введите корректную сумму больше нуля!", "error");
            return;
        }

        triggerConfirm(
            "Отправка запроса в казну",
            `Вы отправляете запрос на ${reqType === 'DEPOSIT' ? 'ВЗНОС' : 'ВЫДАЧУ'} средств в размере $${amt.toLocaleString()} с обоснованием: "${reqDescription}". Данный запрос будет проверен старшим составом. Отправить?`,
            async () => {
                setLoading(true);
                try {
                    const res = await fetch('/api/db', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            action: 'submitTreasuryRequest',
                            userId: user.id,
                            type: reqType,
                            amount: amt,
                            description: reqDescription
                        })
                    });

                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || "Failed to submit treasury request");

                    addToast("Запрос в казну успешно подан старшему составу!", "success");
                    setShowTreasuryRequestModal(false);
                    setReqAmount('');
                    setReqDescription('');
                    refreshUserData(user.id);
                } catch (err) {
                    addToast(err.message, "error");
                } finally {
                    setLoading(false);
                }
            },
            "Отправить запрос",
            "Отмена"
        );
    };

    // Approve a treasury request (Admin only)
    const handleApproveTreasuryRequest = async (requestId, comment) => {
        setLoading(true);
        try {
            const res = await fetch('/api/db', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-userid': user.id
                },
                body: JSON.stringify({
                    action: 'approveTreasuryRequest',
                    requestId,
                    adminComment: comment || adminTreasuryComment
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Approval failed");

            addToast("Запрос одобрен, баланс участника обновлен!", "success");
            setAdminTreasuryComment('');
            loadAdminData();
            refreshUserData(user.id);
        } catch (err) {
            addToast(err.message, "error");
        } finally {
            setLoading(false);
        }
    };

    // Reject a treasury request (Admin only)
    const handleRejectTreasuryRequest = async (requestId, comment) => {
        setLoading(true);
        try {
            const res = await fetch('/api/db', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-userid': user.id
                },
                body: JSON.stringify({
                    action: 'rejectTreasuryRequest',
                    requestId,
                    adminComment: comment || adminTreasuryComment
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Rejection failed");

            addToast("Запрос в казну отклонен старшим составом.", "info");
            setAdminTreasuryComment('');
            loadAdminData();
            refreshUserData(user.id);
        } catch (err) {
            addToast(err.message, "error");
        } finally {
            setLoading(false);
        }
    };

    // Avatar Custom URL change submit
    const handleAvatarUpdate = async (e) => {
        e.preventDefault();
        if (!customAvatarUrl.trim()) return;
        setLoading(true);
        try {
            const res = await fetch('/api/db', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'updateAvatar',
                    userId: user.id,
                    avatarUrl: customAvatarUrl.trim()
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to update avatar");
            
            addToast("Ваш премиальный аватар успешно обновлен!", "success");
            setShowAvatarModal(false);
            refreshUserData(user.id);
        } catch (err) {
            addToast(err.message, "error");
        } finally {
            setLoading(false);
        }
    };

    // Convert local PC image to Base64 dataURL
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        if (file.size > 2 * 1024 * 1024) {
            addToast("Файл слишком большой! Лимит — 2 МБ.", "error");
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const base64 = event.target.result;
            setCustomAvatarUrl(base64);
            addToast("Изображение загружено с ПК и закодировано!", "success");
        };
        reader.readAsDataURL(file);
    };

    // Feedback Suggestion / Complaint Submit
    const handleFeedbackSubmit = async (e) => {
        e.preventDefault();
        
        if (!feedbackText.trim()) {
            addToast("Опишите подробно суть вашего обращения!", "error");
            return;
        }
        if (feedbackType === 'COMPLAINT' && !feedbackTarget.trim()) {
            addToast("Укажите имя нарушителя, на которого вы оставляете жалобу!", "error");
            return;
        }
        
        setLoading(true);
        try {
            const res = await fetch('/api/db', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'submitFeedback',
                    userId: user.id,
                    type: feedbackType,
                    targetMember: feedbackTarget,
                    text: feedbackText
                })
            });
            
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Feedback submittal failed");
            
            addToast("Ваше обращение успешно зарегистрировано в синдикате!", "success");
            setFeedbackText('');
            setFeedbackTarget('');
            refreshUserData(user.id);
        } catch (err) {
            addToast(err.message, "error");
        } finally {
            setLoading(false);
        }
    };

    // Volodya Chat Submit
    const handleChatSubmit = async (e) => {
        e.preventDefault();
        if (!chatInput.trim() || chatLoading) return;
        
        const text = chatInput;
        setChatInput('');
        
        // Add user message to history
        const userMsg = {
            id: 'msg-' + Math.random(),
            role: 'user',
            text: text,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setChatMessages(prev => [...prev, userMsg]);
        setChatLoading(true);
        
        try {
            // Build simple context history
            const historyContext = chatMessages.slice(-8).map(m => ({
                role: m.role,
                text: m.text
            }));
            
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: text,
                    history: historyContext
                })
            });
            
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Gemini connection error");
            
            setChatMessages(prev => [...prev, {
                id: 'msg-' + Math.random(),
                role: 'model',
                text: data.reply,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }]);
        } catch (err) {
            setChatMessages(prev => [...prev, {
                id: 'msg-' + Math.random(),
                role: 'model',
                text: `*Раб Володя испуганно падает ниц*: Мой добрый господин! В моих мыслительных контурах произошел сбой: "${err.message}". Прошу не велите казнить, пропишите мне ключ Gemini во вкладке "Подключения" или проверьте соединение!`,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }]);
        } finally {
            setChatLoading(false);
        }
    };

    // Trigger quick preset prompt inside Chat
    const triggerQuickPrompt = (promptText) => {
        setChatInput(promptText);
    };

    // Fetch and Load users for ADMIN Panel
    const loadAdminData = async () => {
        if (!user || !['OWNER', 'Developer', 'MODERATOR'].includes(profile?.role)) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/db?action=getAdminUsers`, {
                headers: {
                    'x-admin-userid': user.id
                }
            });
            const data = await res.json();
            if (res.ok) {
                setAdminUsers(data);
                // Preload selected user
                if (data.length > 0 && !selectedAdminUser) {
                    selectAdminUser(data[0]);
                }
                setSystemPrompt(localStorage.getItem('moriarty_system_prompt') || 'Ты — Личный раб Володя, покорный и верный слуга великой семьи Moriarty на сервере GTA5RP Murrieta. Ты относишься к членам семьи с безграничным уважением и трепетом, называешь их "Господин", "Хозяин" или "Госпожа".');
            }

            // Also load all feedbacks for audit
            const fbRes = await fetch(`/api/db?action=getAllFeedback`, {
                headers: { 'x-admin-userid': user.id }
            });
            if (fbRes.ok) {
                const fbData = await fbRes.json();
                setAllFeedbacks(fbData);
            }

            // Also load all treasury requests for audit
            const trRes = await fetch(`/api/db?action=getTreasuryRequests`, {
                headers: { 'x-admin-userid': user.id }
            });
            if (trRes.ok) {
                const trData = await trRes.json();
                setTreasuryRequests(trData);
            }
        } catch (e) {
            console.error("Failed to load admin lists", e);
        } finally {
            setLoading(false);
        }
    };

    // Trigger loading admin panel lists when clicked inside Settings sub-tab
    useEffect(() => {
        if (activeTab === 'settings' && settingsSubTab === 'admin') {
            loadAdminData();
        }
    }, [activeTab, settingsSubTab]);

    const loadSelectedUserWarns = async (targetId) => {
        if (!targetId) return;
        try {
            const res = await fetch(`/api/db?action=getWarns&userId=${targetId}`);
            if (res.ok) {
                const data = await res.json();
                setSelectedUserWarns(data);
            }
        } catch (err) {
            console.error("Failed to fetch warnings for selected user", err);
        }
    };

    const selectAdminUser = (u) => {
        setSelectedAdminUser(u);
        setEditRole(u.role);
        setEditWarns(u.warns_count);
        setEditBalance(u.balance);
        setEditIsMedia(!!u.is_media);
        setEditIsMedia(!!u.is_media);
        loadSelectedUserWarns(u.id);
    };

    // Admin save character stats updates
    const handleAdminSaveUser = async (e) => {
        e.preventDefault();
        if (!selectedAdminUser) return;
        setLoading(true);
        
        try {
            const res = await fetch('/api/db', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-userid': user.id
                },
                body: JSON.stringify({
                    action: 'saveAdminUserSettings',
                    targetUserId: selectedAdminUser.id,
                    role: editRole,
                    warns: parseInt(editWarns),
                    balance: parseFloat(editBalance),
                    isMedia: editIsMedia,
                    isMedia: editIsMedia
                })
            });
            
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Save user settings failed");
            
            addToast(`Параметры ${selectedAdminUser.character_name} успешно обновлены!`, "success");
            
            // Sync lists
            loadAdminData();
            // Sync own profile if we edited ourselves
            if (selectedAdminUser.id === user.id) {
                refreshUserData(user.id);
            }
        } catch (err) {
            addToast(err.message, "error");
        } finally {
            setLoading(false);
        }
    };

    // Admin delete member account permanently
    const handleAdminDeleteUser = async (targetId) => {
        triggerConfirm(
            "Исключение члена семьи",
            `Вы действительно хотите НАВСЕГДА ИСКЛЮЧИТЬ И УДАЛИТЬ аккаунт ${selectedAdminUser.character_name} из базы данных семьи Moriarty? Это действие безвозвратно сотрет все транзакции, выговоры и фидбеки бойца.`,
            async () => {
                setLoading(true);
                try {
                    const res = await fetch('/api/db', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-admin-userid': user.id
                        },
                        body: JSON.stringify({
                            action: 'deleteUser',
                            targetUserId: targetId
                        })
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || "Failed to delete account");
                    
                    addToast(`Аккаунт ${selectedAdminUser.character_name} стерт из архивов синдиката!`, "success");
                    setSelectedAdminUser(null);
                    loadAdminData();
                } catch (err) {
                    addToast(err.message, "error");
                } finally {
                    setLoading(false);
                }
            }
        );
    };

    // Admin live overwrite Volodya System Prompt
    const handleAdminSavePrompt = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        try {
            const res = await fetch('/api/db', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-userid': user.id
                },
                body: JSON.stringify({
                    action: 'saveSystemPrompt',
                    prompt: systemPrompt
                })
            });
            
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to update prompt");
            
            addToast("Системный промпт Володи успешно перезаписан!", "success");
            localStorage.setItem('moriarty_system_prompt', systemPrompt);
        } catch (err) {
            addToast(err.message, "error");
        } finally {
            setLoading(false);
        }
    };
    // Admin: Issue Warning to any User
    const handleIssueWarn = async (e) => {
        e.preventDefault();
        if (!selectedAdminUser || !warnReason.trim()) {
            addToast("Выберите бойца и укажите причину выговора!", "error");
            return;
        }

        triggerConfirm(
            "Выдача выговора участнику",
            `Вы действительно хотите выдать активный выговор бойцу ${selectedAdminUser.character_name} по причине: "${warnReason.trim()}"? Это действие увеличит его счетчик нарушений.`,
            async () => {
                setLoading(true);
                try {
                    const res = await fetch('/api/db', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-admin-userid': user.id
                        },
                        body: JSON.stringify({
                            action: 'addWarn',
                            targetUserId: selectedAdminUser.id,
                            reason: warnReason.trim()
                        })
                    });

                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || "Failed to add warning");

                    addToast(`Выговор успешно выдан бойцу ${selectedAdminUser.character_name}!`, "success");
                    setWarnReason('');
                    loadAdminData();
                    loadSelectedUserWarns(selectedAdminUser.id);
                    refreshUserData(user.id);
                } catch (err) {
                    addToast(err.message, "error");
                } finally {
                    setLoading(false);
                }
            },
            "Выдать выговор",
            "Отмена"
        );
    };

    // Admin: Lift/Expire Warning
    const handleLiftWarn = async (warnId, warnReasonText) => {
        triggerConfirm(
            "Снятие дисциплинарного взыскания",
            `Вы действительно хотите аннулировать/снять данный выговор ("${warnReasonText}")? Статус выговора изменится на "Снят/Истек".`,
            async () => {
                setLoading(true);
                try {
                    const res = await fetch('/api/db', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-admin-userid': user.id
                        },
                        body: JSON.stringify({
                            action: 'liftWarn',
                            warnId
                        })
                    });

                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || "Failed to lift warning");

                    addToast("Выговор успешно аннулирован!", "success");
                    loadAdminData();
                    loadSelectedUserWarns(selectedAdminUser.id);
                    refreshUserData(user.id);
                } catch (err) {
                    addToast(err.message, "error");
                } finally {
                    setLoading(false);
                }
            },
            "Снять выговор",
            "Отмена"
        );
    };

    // Admin: Reply to Suggestions/Complaints and resolve status
    const handleReplyFeedback = async (feedbackId, text, nextStatus) => {
        setLoading(true);
        try {
            const res = await fetch('/api/db', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-userid': user.id
                },
                body: JSON.stringify({
                    action: 'replyFeedback',
                    feedbackId,
                    replyText: text || adminReplyText,
                    status: nextStatus
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to reply to feedback");

            addToast(`Обращение обработано, статус изменен на ${nextStatus === 'APPROVED' ? 'ОДОБРЕНО' : 'ОТКЛОНЕНО'}!`, "success");
            setAdminReplyText('');
            loadAdminData();
            refreshUserData(user.id);
        } catch (err) {
            addToast(err.message, "error");
        } finally {
            setLoading(false);
        }
    };
    // Connections Settings changes
    const handleConfigSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        try {
            const res = await fetch('/api/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    supabaseUrl: config.supabaseUrl,
                    supabaseAnonKey: config.supabaseAnonKey.includes('...') ? undefined : config.supabaseAnonKey,
                    geminiApiKey: config.geminiApiKey.includes('...') ? undefined : config.geminiApiKey,
                    discordClientId: config.discordClientId,
                    discordClientSecret: config.discordClientSecret || undefined
                })
            });
            
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Save configuration failed");
            
            addToast("Настройки подключения сохранены на сервере!", "success");
            fetchConfig();
            if (user) refreshUserData(user.id);
        } catch (err) {
            addToast(err.message, "error");
        } finally {
            setLoading(false);
        }
    };

    // Reset settings to fallback demo mode
    const handleConfigReset = async () => {
        triggerConfirm(
            "Сброс настроек подключения",
            "Вы действительно хотите сбросить все сохраненные API-ключи, Supabase-линк и переключить кабинет обратно в Демо-режим?",
            async () => {
                setLoading(true);
                try {
                    const res = await fetch('/api/config', { method: 'DELETE' });
                    if (!res.ok) throw new Error("Сброс не удался");
                    
                    addToast("Кабинет успешно переведен в Demo-Mode.", "info");
                    fetchConfig();
                    if (user) refreshUserData(user.id);
                } catch (err) {
                    addToast(err.message, "error");
                } finally {
                    setLoading(false);
                }
            }
        );
    };

    const getProceduralAvatar = (name) => {
        return `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(name || 'Moriarty')}&backgroundColor=cda242`;
    };

    const getNotifications = () => {
        const notifications = [];
        
        if (isOwnerOrDev) {
            // Admin alerts
            treasuryRequests.forEach(req => {
                if (req.status === 'PENDING') {
                    notifications.push({
                        id: `tr-${req.id}`,
                        type: 'treasury',
                        title: 'Запрос в казну',
                        text: `Боец ${req.character_name} (CID: ${req.static_id}) подал заявку на ${req.type === 'DEPOSIT' ? 'ВЗНОС' : 'ВЫДАЧУ'} средств в размере ${formatCurrency(req.amount)}.`,
                        meta: req.description ? `Обоснование: ${req.description}` : 'Без описания',
                        date: req.created_at,
                        action: () => {
                            setActiveTab('settings');
                            setSettingsSubTab('admin');
                            setAdminSubTab('treasury');
                        },
                        btnText: 'Рассмотреть заявку'
                    });
                }
            });
            
            allFeedbacks.forEach(fb => {
                if (fb.status === 'PENDING') {
                    notifications.push({
                        id: `fb-${fb.id}`,
                        type: fb.type === 'COMPLAINT' ? 'complaint' : 'suggestion',
                        title: fb.type === 'COMPLAINT' ? 'Жалоба на бойца' : 'Предложение синдикату',
                        text: fb.type === 'COMPLAINT' 
                            ? `Поступило обращение от бойца ID: ${fb.user_id} на члена семьи: ${fb.target_member}.` 
                            : `Новое предложение по развитию синдиката от бойца ID: ${fb.user_id}.`,
                        meta: `Содержание: ${fb.text}`,
                        date: fb.created_at,
                        action: () => {
                            setActiveTab('settings');
                            setSettingsSubTab('admin');
                            setAdminSubTab('feedback');
                        },
                        btnText: 'Проверить репорт'
                    });
                }
            });
        } else {
            // Normal user alerts
            treasuryRequests.forEach(req => {
                if (req.status !== 'PENDING') {
                    notifications.push({
                        id: `tr-user-${req.id}`,
                        type: req.status === 'APPROVED' ? 'success-update' : 'error-update',
                        title: `Запрос в казну ${req.status === 'APPROVED' ? 'одобрен' : 'отклонен'}`,
                        text: `Ваша заявка на ${req.type === 'DEPOSIT' ? 'взнос' : 'выдачу'} ${formatCurrency(req.amount)} была ${req.status === 'APPROVED' ? 'успешно подтверждена старшим составом' : 'отклонена руководством'}.`,
                        meta: req.admin_comment ? `Вердикт: ${req.admin_comment}` : '',
                        date: req.created_at,
                        action: () => {
                            setActiveTab('balance');
                        },
                        btnText: 'В кошелек'
                    });
                }
            });
            
            feedbackList.forEach(fb => {
                if (fb.status !== 'PENDING') {
                    notifications.push({
                        id: `fb-user-${fb.id}`,
                        type: fb.status === 'APPROVED' ? 'success-update' : 'error-update',
                        title: `Ваше обращение ${fb.status === 'APPROVED' ? 'принято' : 'отклонено'}`,
                        text: `Ваше ${fb.type === 'SUGGESTION' ? 'предложение' : 'жалоба'} получило официальный вердикт старшего состава.`,
                        meta: fb.admin_comment ? `Ответ руководства: ${fb.admin_comment}` : '',
                        date: fb.created_at,
                        action: () => {
                            setActiveTab('feedback');
                        },
                        btnText: 'Посмотреть ответ'
                    });
                }
            });
        }
        
        return notifications.sort((a, b) => new Date(b.date) - new Date(a.date));
    };

    const formatCurrency = (val) => {
        return `$${parseFloat(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const formatDate = (isoString) => {
        if (!isoString) return 'Неизвестно';
        return new Date(isoString).toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Auth screen render
    if (!user) {
        return (
            <div className="auth-overlay">
                {/* Dynamic animated liquid background blobs */}
                <div className="auth-liquid-bg">
                    <div className="auth-blob one"></div>
                    <div className="auth-blob two"></div>
                    <div className="auth-blob three"></div>
                </div>

                <div className="auth-card animate-fade-in">
                    <div className="auth-header">
                        <img 
                            src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80" 
                            alt="Moriarty Crest" 
                            className="auth-logo"
                        />
                        <h2 className="brand-text">Moriarty</h2>
                        <p className="auth-subtitle">СЕМЕЙНЫЙ КАБИНЕТ | MURRIETA</p>
                    </div>

                    {error && (
                        <div className="alert alert-danger">
                            <i className="fa-solid fa-triangle-exclamation"></i>
                            <span>{error}</span>
                        </div>
                    )}
                    
                    {success && (
                        <div className="alert alert-success">
                            <i className="fa-solid fa-circle-check"></i>
                            <span>{success}</span>
                        </div>
                    )}

                    <div className="auth-tabs">
                        <button 
                            className={`auth-tab-btn ${authMode === 'login' ? 'active' : ''}`}
                            onClick={() => { setAuthMode('login'); setError(''); }}
                        >
                            Вход
                        </button>
                        <button 
                            className={`auth-tab-btn ${authMode === 'register' ? 'active' : ''}`}
                            onClick={() => { setAuthMode('register'); setError(''); }}
                        >
                            Регистрация
                        </button>
                    </div>

                    <form onSubmit={handleAuth} className="auth-form">
                        <div className="form-group">
                            <label>Email адреc</label>
                            <input 
                                type="email" 
                                className="input-glow" 
                                placeholder="name@moriarty.fam"
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)} 
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Пароль</label>
                            <input 
                                type="password" 
                                className="input-glow" 
                                placeholder="••••••••"
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)} 
                                required
                            />
                        </div>

                        {authMode === 'register' && (
                            <>
                                <div className="form-group animate-slide-down">
                                    <label>Игровое Имя_Фамилия</label>
                                    <input 
                                        type="text" 
                                        className="input-glow" 
                                        placeholder="Arthur_Moriarty"
                                        value={charName} 
                                        onChange={(e) => setCharName(e.target.value)} 
                                        required
                                    />
                                    <small className="help-text">Должно соответствовать РП нику с нижним подчеркиванием</small>
                                </div>

                                <div className="form-group animate-slide-down">
                                    <label>CID Персонажа (Static ID)</label>
                                    <input 
                                        type="text" 
                                        className="input-glow" 
                                        placeholder="8542"
                                        value={staticId} 
                                        onChange={(e) => setStaticId(e.target.value)} 
                                        required
                                    />
                                </div>

                                <div className="form-group animate-slide-down">
                                    <label>Реферальный код (Если есть)</label>
                                    <input 
                                        type="text" 
                                        className="input-glow" 
                                        placeholder="MORI-777"
                                        value={referral} 
                                        onChange={(e) => setReferral(e.target.value)} 
                                    />
                                </div>
                            </>
                        )}

                        <button type="submit" className="btn-primary auth-submit-btn" disabled={loading}>
                            {loading ? (
                                <i className="fa-solid fa-spinner fa-spin"></i>
                            ) : (
                                <>
                                    <i className="fa-solid fa-right-to-bracket"></i>
                                    <span>{authMode === 'login' ? 'Войти в кабинет' : 'Стать членом семьи'}</span>
                                </>
                            )}
                        </button>
                    </form>

                    <div className="divider"><span>ИЛИ</span></div>

                    <button 
                        type="button" 
                        onClick={handleDiscordSimulatedLogin} 
                        className="btn-discord" 
                        disabled={loading}
                    >
                        <i className="fa-brands fa-discord"></i>
                        <span>Вход через Discord (Тест-Симуляция)</span>
                    </button>
                </div>

                {/* Floating Toast System in Auth */}
                <div className="toast-container">
                    {toasts.map(toast => (
                        <div key={toast.id} className={`toast-item ${toast.type}`}>
                            <i className={`fa-solid ${toast.type === 'success' ? 'fa-circle-check' : toast.type === 'error' ? 'fa-circle-xmark' : 'fa-circle-info'}`}></i>
                            <span>{toast.msg}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Active logged-in layout
    const activeProfile = profile || user;
    const isOwnerOrDev = ['OWNER', 'Developer', 'MODERATOR'].includes(activeProfile?.role);
    
    // Warn indicators calculations
    const displayWarns = activeProfile?.warns_count || 0;
    const hasCriticalWarns = displayWarns >= 3;

    return (
        <div className="app-container">
            
            {/* Sidebar Shell */}
            <aside className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
                <div>
                    <div className="sidebar-header">
                        <div className="sidebar-logo">
                            <img 
                                src={activeProfile.discord?.avatar || getProceduralAvatar(activeProfile.character_name)} 
                                alt="Crest" 
                                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                            />
                        </div>
                        <div>
                            <h3 className="brand-text sidebar-title">Moriarty</h3>
                            <span className="sidebar-subtitle">Кабинет</span>
                        </div>
                    </div>

                    <ul className="nav-menu">
                        <li className="nav-item">
                            <a 
                                className={`nav-link ${activeTab === 'stats' ? 'active' : ''}`}
                                onClick={() => { setActiveTab('stats'); setMobileMenuOpen(false); }}
                            >
                                <i className="fa-solid fa-chart-simple"></i>
                                <span>Характеристики</span>
                            </a>
                        </li>
                        <li className="nav-item">
                            <a 
                                className={`nav-link ${activeTab === 'balance' ? 'active' : ''}`}
                                onClick={() => { setActiveTab('balance'); setMobileMenuOpen(false); }}
                            >
                                <i className="fa-solid fa-wallet"></i>
                                <span>Казна и переводы</span>
                            </a>
                        </li>
                        <li className="nav-item">
                            <a 
                                className={`nav-link ${activeTab === 'warns' ? 'active' : ''}`}
                                onClick={() => { setActiveTab('warns'); setMobileMenuOpen(false); }}
                            >
                                <i className="fa-solid fa-triangle-exclamation"></i>
                                <span>Выговоры ({displayWarns}/3)</span>
                            </a>
                        </li>
                        <li className="nav-item">
                            <a 
                                className={`nav-link ${activeTab === 'feedback' ? 'active' : ''}`}
                                onClick={() => { setActiveTab('feedback'); setMobileMenuOpen(false); }}
                            >
                                <i className="fa-solid fa-comments"></i>
                                <span>Обратная связь</span>
                            </a>
                        </li>
                        <li className="nav-item">
                            <a 
                                className={`nav-link ${activeTab === 'referrals' ? 'active' : ''}`}
                                onClick={() => { setActiveTab('referrals'); setMobileMenuOpen(false); }}
                            >
                                <i className="fa-solid fa-users-viewfinder"></i>
                                <span>Рефералы</span>
                            </a>
                        </li>
                        <li className="nav-item">
                            <a 
                                className={`nav-link ${activeTab === 'volodya' ? 'active' : ''}`}
                                onClick={() => { setActiveTab('volodya'); setMobileMenuOpen(false); }}
                                style={{ borderRight: '2px solid var(--primary)' }}
                            >
                                <i className="fa-solid fa-comment-dots" style={{ color: 'var(--primary)' }}></i>
                                <span>Личный раб Володя</span>
                                <span className="status-indicator"></span>
                            </a>
                        </li>
                        
                        <li className="nav-item">
                            <a 
                                className={`nav-link ${activeTab === 'notifications' ? 'active' : ''}`}
                                onClick={() => { setActiveTab('notifications'); setMobileMenuOpen(false); }}
                            >
                                <i className="fa-solid fa-bell"></i>
                                <span>Уведомления</span>
                                {getNotifications().length > 0 && (
                                    <span className="nav-link-badge">
                                        {getNotifications().length}
                                    </span>
                                )}
                            </a>
                        </li>
                        <li className="nav-item">
                            <a 
                                className={`nav-link ${activeTab === 'settings' ? 'active' : ''}`}
                                onClick={() => { setActiveTab('settings'); setMobileMenuOpen(false); }}
                            >
                                <i className="fa-solid fa-gear"></i>
                                <span>Настройки</span>
                            </a>
                        </li>
                        {activeProfile && activeProfile.is_media && (
                            <li className="nav-item">
                                <a 
                                    className={`nav-link ${activeTab === 'streamer' ? 'active' : ''}`}
                                    onClick={() => { setActiveTab('streamer'); setMobileMenuOpen(false); }}
                                    style={{ border: '1px solid rgba(179, 154, 116, 0.25)', background: activeTab === 'streamer' ? 'var(--primary-neon)' : 'rgba(179, 154, 116, 0.05)', marginTop: '5px' }}
                                >
                                    <i className="fa-solid fa-tower-broadcast" style={{ color: activeTab === 'streamer' ? '#fff' : 'var(--primary-neon)' }}></i>
                                    <span style={{ color: activeTab === 'streamer' ? '#fff' : 'var(--primary-neon)', fontWeight: '600' }}>Панель стримера</span>
                                </a>
                            </li>
                        )}
                    </ul>
                </div>

                {/* Faction Discord Join Banner */}
                <div className="discord-banner-sidebar" style={{ margin: '1rem' }}>
                    <i className="fa-brands fa-discord animate-pulse" style={{ fontSize: '2rem', color: '#5865f2', filter: 'drop-shadow(0 0 6px rgba(88,101,242,0.4))' }}></i>
                    <h4 style={{ margin: '6px 0 2px', fontSize: '0.82rem', fontWeight: '800' }}>Наш Discord</h4>
                    <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Будь в центре событий синдиката!</p>
                    <a href="https://discord.gg/AjtjVC2hm2" target="_blank" rel="noopener noreferrer" className="btn-discord-join">
                        <i className="fa-solid fa-right-to-bracket"></i>
                        Вступить
                    </a>
                </div>

                <div className="sidebar-footer">
                    <div className="user-snippet">
                        <div className="user-snippet-avatar">
                            <img src={activeProfile.discord?.avatar || getProceduralAvatar(activeProfile.character_name)} alt="DS" />
                        </div>
                        <div className="user-snippet-info">
                            <h4 className="user-snippet-name">{activeProfile.character_name}</h4>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '2px' }}>
                                <span className="user-snippet-role" style={{ fontSize: '0.62rem' }}>{activeProfile.role}</span>
                                {activeProfile.is_media && (
                                    <span className="badge-media-gold" style={{ scale: '0.85', transformOrigin: 'left' }}>
                                        <i className="fa-solid fa-star"></i> MEDIA
                                    </span>
                                )}
                            </div>
                        </div>
                        <button onClick={handleLogout} className="btn-logout" title="Выйти">
                            <i className="fa-solid fa-power-off"></i>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Panel */}
            <main className="main-content">
                <header className="main-header">
                    <div className="header-title-wrap">
                        <h1>
                            Приветствуем,{' '}
                            <span className="brand-text">
                                {activeProfile.character_name.split('_')[0]}
                            </span>!
                        </h1>
                        <p>Управление синдикатом Moriarty — GTA5RP Murrieta</p>
                    </div>

                    <div className="header-actions">
                        <span className="server-badge">Murrieta</span>
                        <div className={`connection-status ${isSupabaseMode ? '' : 'demo'}`}>
                            <span className="status-dot"></span>
                            <span>{isSupabaseMode ? 'Supabase Облако' : 'Demo Локальная'}</span>
                        </div>
                        <button 
                            className="mobile-nav-toggle"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            <i className={`fa-solid ${mobileMenuOpen ? 'fa-xmark' : 'fa-bars'}`}></i>
                        </button>
                    </div>
                </header>

                {/* DYNAMIC TABS PANEL */}

                {/* 1. CHARACTER STATS TAB */}
                <div className={`tab-panel ${activeTab === 'stats' ? 'active' : ''}`}>
                    <div className="stats-banner glass-panel glow-purple animate-fade-in">
                        <div className="avatar-large-container" style={{ margin: 0 }}>
                            <div className="avatar-rotating-ring" style={{ width: '146px', height: '146px' }}></div>
                            <div 
                                className="avatar-container-wrap" 
                                onClick={() => {
                                    setCustomAvatarUrl(activeProfile.discord?.avatar || '');
                                    setShowAvatarModal(true);
                                }}
                                title="Сменить аватарку"
                                style={{ width: '120px', height: '120px' }}
                            >
                                <div className="avatar-large">
                                    <img src={activeProfile.discord?.avatar || getProceduralAvatar(activeProfile.character_name)} alt="Av" />
                                </div>
                                <div className="avatar-edit-overlay" style={{ borderRadius: '12px' }}>
                                    <i className="fa-solid fa-gear"></i>
                                </div>
                            </div>
                        </div>
                        <div className="banner-profile-info">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                <h2 className="char-title" style={{ margin: 0 }}>{activeProfile.character_name}</h2>
                                {activeProfile.is_media && (
                                    <span className="badge-media-gold" style={{ fontSize: '0.7rem', padding: '4px 12px' }}>
                                        <i className="fa-solid fa-star"></i> MEDIA PARTNER
                                    </span>
                                )}
                            </div>
                            <span className="char-static">Static CID: {activeProfile.static_id}</span>
                            {activeProfile.is_media && (
                                <div style={{ marginTop: '8px' }}>
                                    <button 
                                        onClick={() => setActiveTab('streamer')} 
                                        className="btn-primary"
                                        style={{ 
                                            padding: '6px 14px', 
                                            fontSize: '0.8rem', 
                                            display: 'inline-flex', 
                                            alignItems: 'center', 
                                            gap: '6px',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            background: 'linear-gradient(135deg, var(--primary-neon) 0%, #D5BE97 100%)',
                                            border: 'none',
                                            color: '#fff',
                                            fontWeight: '600',
                                            boxShadow: '0 4px 12px rgba(179, 154, 116, 0.2)'
                                        }}
                                    >
                                        <i className="fa-solid fa-tower-broadcast"></i> Панель стримера
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className="banner-stats">
                            <div className="banner-stat-item">
                                <div className="banner-stat-value brand-text" style={{ fontSize: '1.9rem' }}>
                                    {formatCurrency(activeProfile.balance)}
                                </div>
                                <span className="banner-stat-label">Личный счет</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid-stats">
                        <div className="stat-card glass-panel">
                            <div className="stat-icon"><i className="fa-solid fa-shield"></i></div>
                            <div className="stat-details">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                    <span className="stat-val">{activeProfile.role}</span>
                                    {activeProfile.is_media && (
                                        <span className="badge-media-gold" style={{ scale: '0.9', transformOrigin: 'left' }}>
                                            <i className="fa-solid fa-star"></i> MEDIA
                                        </span>
                                    )}
                                </div>
                                <span className="stat-lbl">Должность в семье</span>
                            </div>
                        </div>
                        <div className="stat-card glass-panel">
                            <div className="stat-icon"><i className="fa-solid fa-triangle-exclamation"></i></div>
                            <div className="stat-details">
                                <span className="stat-val">{displayWarns} / 3</span>
                                <span className="stat-lbl">Активные выговоры</span>
                            </div>
                        </div>
                        <div className="stat-card glass-panel">
                            <div className="stat-icon"><i className="fa-solid fa-users"></i></div>
                            <div className="stat-details">
                                <span className="stat-val">{referrals.length} чел.</span>
                                <span className="stat-lbl">Приглашенные игроки</span>
                            </div>
                        </div>
                        <div className="stat-card glass-panel">
                            <div className="stat-icon"><i className="fa-solid fa-fingerprint"></i></div>
                            <div className="stat-details">
                                <span className="stat-val">MORI-{activeProfile.static_id}</span>
                                <span className="stat-lbl">Ваш реф. промокод</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. FINANCE BALANCE TAB */}
                <div className={`tab-panel ${activeTab === 'balance' ? 'active' : ''}`}>
                    <div className="balance-widget">
                        
                        <div className="balance-card-glowing glass-panel glow-purple animate-fade-in">
                            <span className="sidebar-subtitle" style={{ letterSpacing: '3px' }}>Личная ячейка</span>
                            <div className="balance-huge">{formatCurrency(activeProfile.balance)}</div>
                            <div className="balance-actions">
                                <button className="btn-primary" onClick={() => setShowTreasuryRequestModal(true)}>
                                    <i className="fa-solid fa-vault"></i>
                                    <span>Заявка в казну</span>
                                </button>
                                <button className="btn-secondary" onClick={() => setShowTransferModal(true)}>
                                    <i className="fa-solid fa-arrow-right-arrow-left"></i>
                                    <span>Перевести по CID</span>
                                </button>
                            </div>
                        </div>

                        <div className="balance-grid-2col" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginTop: '20px' }}>
                            {/* Left panel: Treasury Requests */}
                            <div className="glass-panel">
                                <h3 style={{ marginBottom: '1.4rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <i className="fa-solid fa-clock-rotate-left" style={{ color: 'var(--primary)' }}></i>
                                    Заявки на согласование
                                </h3>
                                <div className="ledger-wrapper" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                    {treasuryRequests.length === 0 ? (
                                        <div className="empty-state" style={{ padding: '2rem 1rem' }}>
                                            <i className="fa-solid fa-folder-open"></i>
                                            <p>Заявки отсутствуют</p>
                                        </div>
                                    ) : (
                                        treasuryRequests.map((req) => (
                                            <div key={req.id} className="ledger-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '8px', padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <i className={`fa-solid ${req.type === 'DEPOSIT' ? 'fa-arrow-down' : 'fa-arrow-up'}`} style={{ color: req.type === 'DEPOSIT' ? 'var(--primary)' : 'var(--danger)' }}></i>
                                                        {req.type === 'DEPOSIT' ? 'Взнос' : 'Выдача'}
                                                    </span>
                                                    <span className={`status-badge ${req.status.toLowerCase()}`} style={{ fontSize: '0.7rem', padding: '4px 8px', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 'bold' }}>
                                                        {req.status === 'PENDING' ? 'Ожидает' : req.status === 'APPROVED' ? 'Одобрен' : 'Отклонен'}
                                                    </span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Сумма:</span>
                                                    <span style={{ fontWeight: 'bold', color: 'var(--text-bright)' }}>{formatCurrency(req.amount)}</span>
                                                </div>
                                                {req.description && (
                                                    <div style={{ fontSize: '0.8rem', background: 'rgba(0,0,0,0.15)', padding: '6px 8px', borderRadius: '4px', borderLeft: '2px solid var(--primary)', color: 'var(--text-muted)' }}>
                                                        {req.description}
                                                    </div>
                                                )}
                                                {req.admin_comment && (
                                                    <div style={{ fontSize: '0.78rem', padding: '4px 8px', color: 'var(--primary)', fontStyle: 'italic', display: 'flex', gap: '4px', alignItems: 'flex-start' }}>
                                                        <i className="fa-solid fa-comment-dots" style={{ marginTop: '3px' }}></i>
                                                        <span>Вердикт: {req.admin_comment}</span>
                                                    </div>
                                                )}
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                                                    {formatDate(req.created_at)}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Right panel: Finalized Transactions */}
                            <div className="glass-panel">
                                <h3 style={{ marginBottom: '1.4rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <i className="fa-solid fa-receipt" style={{ color: 'var(--primary)' }}></i>
                                    История транзакций
                                </h3>
                                <div className="ledger-wrapper" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                    {transactions.length === 0 ? (
                                        <div className="empty-state" style={{ padding: '2rem 1rem' }}>
                                            <i className="fa-solid fa-receipt"></i>
                                            <p>Транзакции отсутствуют</p>
                                        </div>
                                    ) : (
                                        transactions.map((tx) => (
                                            <div key={tx.id} className="ledger-item">
                                                <div className="ledger-left">
                                                    <div className={`ledger-badge ${tx.type === 'DEPOSIT' ? 'deposit' : tx.type === 'WITHDRAW' ? 'withdraw' : 'transfer'}`}>
                                                        <i className={`fa-solid ${tx.type === 'DEPOSIT' ? 'fa-arrow-down' : tx.type === 'WITHDRAW' ? 'fa-arrow-up' : 'fa-arrow-right-arrow-left'}`}></i>
                                                    </div>
                                                    <div className="ledger-info">
                                                        <span className="ledger-desc">{tx.description}</span>
                                                        <span className="ledger-date">{formatDate(tx.created_at)}</span>
                                                    </div>
                                                </div>
                                                <span className={`ledger-amount ${tx.amount > 0 ? 'plus' : 'minus'}`}>
                                                    {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                                                </span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* 3. WARNS TAB */}
                <div className={`tab-panel ${activeTab === 'warns' ? 'active' : ''}`}>
                    <div className="warns-dashboard">
                        
                        <div className="glass-panel warn-visual-box glow-purple">
                            <div className="warn-counter-dial">
                                <div className="warn-counter-inner" style={{ color: hasCriticalWarns ? 'var(--danger)' : 'var(--primary)' }}>
                                    {displayWarns}
                                </div>
                            </div>
                            <h3>{hasCriticalWarns ? 'ВЫГОВОРЫ ПРЕВЫШЕНЫ' : 'Уровень нарушений'}</h3>
                            <p style={{ marginTop: '8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                {hasCriticalWarns 
                                    ? 'Превышен лимит выговоров (3/3). Ожидайте исключения или свяжитесь с OWNER!' 
                                    : 'При достижении 3/3 активных выговоров наступает автоматическое изгнание с позором.'}
                            </p>
                        </div>

                        <div className="glass-panel">
                            <h3 style={{ marginBottom: '1.4rem' }}>Протоколы взысканий</h3>
                            <div className="warns-list">
                                {warns.length === 0 ? (
                                    <div className="empty-state">
                                        <i className="fa-solid fa-clipboard-check"></i>
                                        <p>У вас нет активных или истекших выговоров! Семья гордится вами.</p>
                                    </div>
                                ) : (
                                    warns.map((w) => (
                                        <div key={w.id} className={`warn-item ${w.status === 'EXPIRED' ? 'expired' : ''}`}>
                                            <div className="warn-item-left">
                                                <i className="fa-solid fa-triangle-exclamation warn-item-icon"></i>
                                                <div className="warn-item-details">
                                                    <span className="warn-reason">{w.reason}</span>
                                                    <span className="warn-meta">Выдал: {w.issued_by} | {formatDate(w.issued_at)}</span>
                                                </div>
                                            </div>
                                            <span className={`warn-badge-status ${w.status === 'ACTIVE' ? 'active' : 'expired'}`}>
                                                {w.status === 'ACTIVE' ? 'Активен' : 'Снят/Истек'}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                    </div>
                </div>

                {/* 4. FEEDBACK SUGGESTIONS & COMPLAINTS TAB */}
                <div className={`tab-panel ${activeTab === 'feedback' ? 'active' : ''}`}>
                    <div className="feedback-container">
                        
                        <div className="glass-panel feedback-form-box">
                            <h3 style={{ marginBottom: '1.2rem' }}>Создать обращение</h3>
                            
                            <div className="feedback-type-selector">
                                <button 
                                    className={`type-tab ${feedbackType === 'SUGGESTION' ? 'active' : ''}`}
                                    onClick={() => setFeedbackType('SUGGESTION')}
                                >
                                    <i className="fa-solid fa-lightbulb" style={{ marginRight: '8px' }}></i>
                                    Предложение
                                </button>
                                <button 
                                    className={`type-tab complaint ${feedbackType === 'COMPLAINT' ? 'active' : ''}`}
                                    onClick={() => setFeedbackType('COMPLAINT')}
                                >
                                    <i className="fa-solid fa-face-angry" style={{ marginRight: '8px' }}></i>
                                    Жалоба
                                </button>
                            </div>

                            <form onSubmit={handleFeedbackSubmit}>
                                {feedbackType === 'COMPLAINT' && (
                                    <div className="form-group animate-slide-down">
                                        <label>Имя нарушителя (Имя_Фамилия или CID)</label>
                                        <input 
                                            type="text" 
                                            className="input-glow" 
                                            placeholder="Narek_Toretto"
                                            value={feedbackTarget} 
                                            onChange={(e) => setFeedbackTarget(e.target.value)} 
                                            required
                                        />
                                    </div>
                                )}

                                <div className="form-group">
                                    <label>Суть предложения или детали нарушения</label>
                                    <textarea 
                                        className="input-glow textarea-prompt" 
                                        placeholder={feedbackType === 'SUGGESTION' 
                                            ? "Опишите подробно вашу идею, как сделать семью Moriarty сильнее..." 
                                            : "Опишите конфликт или нарушение правил сервера/семьи со стороны участника..."}
                                        value={feedbackText}
                                        onChange={(e) => setFeedbackText(e.target.value)}
                                        required
                                    ></textarea>
                                </div>

                                <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
                                    {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : 'Отправить обращение'}
                                </button>
                            </form>
                        </div>

                        <div className="glass-panel">
                            <h3 style={{ marginBottom: '1.4rem' }}>История обращений</h3>
                            <div className="feedback-history-list">
                                {feedbackList.length === 0 ? (
                                    <div className="empty-state">
                                        <i className="fa-solid fa-message"></i>
                                        <p>Вы еще не подавали жалоб или предложений</p>
                                    </div>
                                ) : (
                                    feedbackList.map((f) => (
                                        <div key={f.id} className="feedback-card">
                                            <div className="feedback-card-header">
                                                <span className={`feedback-badge-type ${f.type.toLowerCase()}`}>
                                                    {f.type === 'SUGGESTION' ? 'Предложение' : 'Жалоба'}
                                                </span>
                                                <span className={`feedback-status ${f.status.toLowerCase()}`}>
                                                    <i className="fa-solid fa-circle" style={{ fontSize: '0.5rem' }}></i>
                                                    {f.status === 'PENDING' ? 'На рассмотрении' : f.status === 'APPROVED' ? 'Одобрено' : 'Отклонено'}
                                                </span>
                                            </div>
                                            
                                            {f.target_member && (
                                                <span className="feedback-target">Нарушитель: {f.target_member}</span>
                                            )}

                                            <p className="feedback-card-text">{f.text}</p>
                                            
                                            {f.admin_comment && (
                                                <div className="feedback-comment">
                                                    <strong>Вердикт старших:</strong> {f.admin_comment}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                    </div>
                </div>

                {/* 5. REFERRALS SYSTEM TAB */}
                <div className={`tab-panel ${activeTab === 'referrals' ? 'active' : ''}`}>
                    <div className="referral-widget">
                        
                        <div className="glass-panel ref-code-box glow-purple">
                            <span className="sidebar-subtitle">Ваша персональная реф-сеть</span>
                            
                            <div 
                                className="ref-code-display" 
                                onClick={() => {
                                    navigator.clipboard.writeText(`MORI-${activeProfile.static_id}`);
                                    addToast("Код успешно скопирован в буфер обмена!", "info");
                                }}
                            >
                                MORI-{activeProfile.static_id}
                            </div>
                            
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                                Дайте этот реферальный промокод новичкам при их первой регистрации в кабинете Moriarty. 
                                Каждый новый игрок получит стартовый бонус <strong>+$10,000</strong> в казну, 
                                а ваш баланс мгновенно пополнится на <strong>+$10,000</strong> в знак благодарности!
                            </p>
                        </div>

                        <div className="glass-panel">
                            <h3 style={{ marginBottom: '1.4rem' }}>Приглашенные бойцы ({referrals.length})</h3>
                            <div className="ref-players-list">
                                {referrals.length === 0 ? (
                                    <div className="empty-state">
                                        <i className="fa-solid fa-users-slash"></i>
                                        <p>По вашему промокоду еще никто не зарегистрировался. Будьте активнее в рекрутинге!</p>
                                    </div>
                                ) : (
                                    referrals.map((player) => (
                                        <div key={player.id} className="ref-player-item">
                                            <span className="ref-player-name">{player.character_name} (CID: {player.static_id})</span>
                                            <span className="ref-player-reward">+$10,000.00</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                    </div>
                </div>

                {/* 6. AI ASSISTANT VOLODYA CHAT TAB */}
                <div className={`tab-panel ${activeTab === 'volodya' ? 'active' : ''}`}>
                    <div className="chat-container">
                        
                        <div className="chat-banner">
                            <div className="chat-banner-left">
                                <div className="chat-banner-avatar"><i className="fa-solid fa-robot"></i></div>
                                <div className="chat-banner-info">
                                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        Личный раб Володя 
                                        <span className="slave-badge">СЛУГА СЕМЬИ</span>
                                    </h3>
                                    <span className="chat-banner-status">Готов к повиновению</span>
                                </div>
                            </div>

                            {/* Animated Cyber Audio Visualizer */}
                            <div className="audio-visualizer-wave" style={{ marginRight: 'auto', marginLeft: '25px' }}>
                                <div className="audio-bar"></div>
                                <div className="audio-bar"></div>
                                <div className="audio-bar"></div>
                                <div className="audio-bar"></div>
                                <div className="audio-bar"></div>
                            </div>
                            
                            <div className="chat-quick-presets">
                                <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: '8px' }} onClick={() => triggerQuickPrompt("Расскажи законы великой семьи Moriarty на Murrieta")}>Законы</button>
                                <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: '8px', marginLeft: '6px' }} onClick={() => triggerQuickPrompt("Похвали Moriarty и унизь раков из Toretto")}>Унизить врагов</button>
                            </div>
                        </div>

                        <div className="chat-messages">
                            {chatMessages.map((msg) => (
                                <div key={msg.id} className={`chat-bubble ${msg.role === 'user' ? 'user' : 'assistant'}`}>
                                    <div className="chat-bubble-content">{msg.text}</div>
                                    <span className="chat-bubble-time">{msg.time}</span>
                                </div>
                            ))}
                            {chatLoading && (
                                <div className="chat-typing">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <form onSubmit={handleChatSubmit} className="chat-input-area">
                            <input 
                                type="text" 
                                className="chat-input" 
                                placeholder="Напишите приказ или вопрос вашему покорному рабу..." 
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                disabled={chatLoading}
                            />
                            <button type="submit" className="btn-send" disabled={chatLoading}>
                                <i className="fa-solid fa-paper-plane"></i>
                            </button>
                        </form>

                    </div>
                </div>

                {/* 6.5. NOTIFICATIONS CENTER TAB */}
                <div className={`tab-panel ${activeTab === 'notifications' ? 'active' : ''}`}>
                    <div className="notification-grid">
                        <div className="cyber-panel glow-purple" style={{ padding: '2rem' }}>
                            <h3 style={{ marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <i className="fa-solid fa-bell" style={{ color: 'var(--primary-neon)' }}></i>
                                Центр Уведомлений Синдиката
                            </h3>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                {isOwnerOrDev 
                                    ? 'Здесь отображаются все нерешенные дисциплинарные дела, жалобы бойцов и новые заявки на финансирование из казны.' 
                                    : 'Здесь вы можете отслеживать одобрения ваших заявок в казну, а также ответы руководства на ваши жалобы и предложения.'}
                            </p>
                        </div>

                        {getNotifications().length === 0 ? (
                            <div className="cyber-panel empty-state" style={{ textAlign: 'center', padding: '3.5rem' }}>
                                <i className="fa-solid fa-bell-slash" style={{ fontSize: '3rem', color: 'var(--text-muted)', marginBottom: '1rem', opacity: 0.3 }}></i>
                                <p style={{ color: 'var(--text-muted)' }}>Все чисто. Новые уведомления отсутствуют.</p>
                            </div>
                        ) : (
                            getNotifications().map((notif) => (
                                <div key={notif.id} className={`notification-card ${notif.type}`}>
                                    <div className="notification-header">
                                        <span className="notification-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <i className={`fa-solid ${
                                                notif.type === 'treasury' ? 'fa-vault' 
                                                : notif.type === 'complaint' ? 'fa-face-angry' 
                                                : notif.type === 'suggestion' ? 'fa-lightbulb' 
                                                : 'fa-envelope-open-text'
                                            }`} style={{ color: 'inherit' }}></i>
                                            {notif.title}
                                        </span>
                                        <span className="notification-date">{formatDate(notif.date)}</span>
                                    </div>
                                    <p className="notification-text">{notif.text}</p>
                                    {notif.meta && (
                                        <div className="notification-meta">
                                            {notif.meta}
                                        </div>
                                    )}
                                    <button 
                                        type="button" 
                                        className="btn-primary notification-action-btn"
                                        onClick={notif.action}
                                    >
                                        {notif.btnText}
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* 6.5. NATIVE STREAMER CABINET PANEL */}
                {activeProfile && activeProfile.is_media && (
                    <div className={`tab-panel ${activeTab === 'streamer' ? 'active' : ''}`}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div className="stats-banner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.8rem 2.5rem' }}>
                                <div className="banner-profile-info">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                        <h1 className="brand-text" style={{ fontSize: '1.6rem', letterSpacing: '1px', margin: 0 }}>
                                            <i className="fa-solid fa-tower-broadcast" style={{ marginRight: '10px' }}></i>
                                            Панель Стримера
                                        </h1>
                                        <span className="badge-media-gold" style={{ fontSize: '0.7rem', padding: '4px 12px' }}>
                                            <i className="fa-solid fa-star"></i> OFFICIAL MEDIA
                                        </span>
                                    </div>
                                    <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: 'var(--font-mono)' }}>
                                        Синхронизированный медиа-кабинет Moriarty & Live-консоль
                                    </p>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <span className="server-badge" style={{ background: 'rgba(179, 154, 116, 0.05)', color: 'var(--primary-neon)' }}>
                                        {activeProfile.character_name}
                                    </span>
                                    <div className="connection-status">
                                        <span className="status-dot animate-pulse" style={{ backgroundColor: isTwitchConnected ? '#6441A5' : 'var(--primary-neon)' }}></span>
                                        <span>Twitch Чат: {isTwitchConnected ? 'АКТИВЕН' : 'НЕ ПОДКЛЮЧЕН'}</span>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                                {/* Left Column: Viewport Simulation & Custom Overlay Builder */}
                                <div style={{ flex: '1.2', display: 'flex', flexDirection: 'column', gap: '1.5rem', minWidth: '320px' }}>
                                    
                                    {/* Viewport Live Simulation */}
                                    <section className="cyber-panel">
                                        <h2 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1.2rem', textTransform: 'uppercase', color: 'var(--primary-neon)' }}>
                                            <i className="fa-solid fa-desktop" style={{ marginRight: '8px' }}></i>
                                            Стрим-Монитор (Simulated Viewport)
                                        </h2>
                                        
                                        <div className="streamer-viewport-wrapper" style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }}>
                                            <img 
                                                src="https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1470&auto=format&fit=crop" 
                                                alt="RP Game Feed" 
                                                className={`streamer-feed-sim ${blurActive ? 'blurred' : ''}`}
                                            />
                                            
                                            {blurActive && (
                                                <div style={{ position: 'absolute', top: '15px', right: '15px', backgroundColor: '#B93C3C', border: '1px solid rgba(255,255,255,0.4)', color: '#fff', padding: '6px 14px', borderRadius: '20px', fontSize: '0.68rem', fontFamily: 'var(--font-mono)', fontWeight: 'bold', boxShadow: '0 4px 15px rgba(185,60,60,0.4)' }}>
                                                    <i className="fa-solid fa-mask" style={{ marginRight: '6px' }}></i>
                                                    HUD И МИНИКАРТА ЗАБЛЮРЕНЫ
                                                </div>
                                            )}

                                            {fakeInfoActive && (
                                                <div className="streamer-overlay-banner animate-pulse" style={{ background: 'rgba(255,255,255,0.95)', border: '1px solid var(--primary-neon)', backdropFilter: 'blur(10px)', color: '#1C1C24' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                        <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Ложные координаты</span>
                                                        <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--primary-neon)' }}>
                                                            <i className="fa-solid fa-compass" style={{ marginRight: '5px' }}></i>
                                                            {fakeData.location}
                                                        </span>
                                                    </div>
                                                    <div style={{ width: '1px', height: '24px', backgroundColor: 'rgba(0,0,0,0.08)' }}></div>
                                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                        <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Фейк Персонаж</span>
                                                        <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
                                                            {fakeData.charName} (CID: {fakeData.cid})
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Anti-Streamsnipe Switches */}
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
                                            <div className="glass-panel" style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                <div className="toggle-switch-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                    <div className="switch-label-wrap">
                                                        <span className="switch-title" style={{ fontWeight: '600', fontSize: '0.88rem' }}>Замыливание худа</span>
                                                        <span className="switch-desc" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Блюр радара и карты по хоткею</span>
                                                    </div>
                                                    <label className="switch">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={blurActive} 
                                                            onChange={(e) => setBlurActive(e.target.checked)} 
                                                        />
                                                        <span className="slider"></span>
                                                    </label>
                                                </div>
                                            </div>
                                            
                                            <div className="glass-panel" style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                <div className="toggle-switch-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                    <div className="switch-label-wrap">
                                                        <span className="switch-title" style={{ fontWeight: '600', fontSize: '0.88rem' }}>Фейк-координаты</span>
                                                        <span className="switch-desc" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Генерация ложного GPS потока</span>
                                                    </div>
                                                    <label className="switch">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={fakeInfoActive} 
                                                            onChange={(e) => setFakeInfoActive(e.target.checked)} 
                                                        />
                                                        <span className="slider"></span>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    {/* Live RP Statistics & OBS Overlay Builder */}
                                    <section className="cyber-panel">
                                        <h2 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1.2rem', textTransform: 'uppercase', color: 'var(--primary-neon)' }}>
                                            <i className="fa-solid fa-clock-rotate-left" style={{ marginRight: '8px' }}></i>
                                            Кастомный Live-оверлей (OBS Browser Source)
                                        </h2>
                                        
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                                            <div className="form-group">
                                                <label style={{ fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-bright)' }}>Ссылка для OBS Browser Source (прозрачный виджет)</label>
                                                <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                                                    <input 
                                                        type="text" 
                                                        readOnly 
                                                        className="input-glow" 
                                                        value={typeof window !== 'undefined' ? `${window.location.origin}/streamer-cabinet/overlay?userId=${activeProfile.id}` : ''} 
                                                        style={{ flexGrow: 1, fontFamily: 'var(--font-mono)', fontSize: '0.8rem', background: 'rgba(0,0,0,0.03)', color: 'var(--primary-neon)', border: '1px solid rgba(179,154,116,0.3)', padding: '10px 14px', borderRadius: '8px' }} 
                                                    />
                                                    <button 
                                                        type="button" 
                                                        className="btn-primary" 
                                                        style={{ borderRadius: '8px', padding: '0 18px', background: 'var(--primary-neon)', color: '#fff', border: 'none', cursor: 'pointer' }}
                                                        onClick={() => {
                                                            const overlayUrl = `${window.location.origin}/streamer-cabinet/overlay?userId=${activeProfile.id}`;
                                                            navigator.clipboard.writeText(overlayUrl);
                                                            addToast("Ссылка для OBS успешно скопирована!", "success");
                                                        }}
                                                    >
                                                        <i className="fa-solid fa-copy"></i>
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Recycled Freaks Counter Dashboard Panel */}
                                            <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(179, 154, 116, 0.04) 0%, rgba(255, 255, 255, 0.9) 100%)', border: '1px solid rgba(179,154,116,0.2)' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: 'var(--font-mono)', fontWeight: '600' }}>Утилизировано фриков на стриме</span>
                                                    <h3 style={{ fontSize: '2.2rem', fontFamily: 'var(--font-mono)', fontWeight: '700', color: 'var(--text-bright)', margin: 0 }}>
                                                        {trashCounter} <span style={{ fontSize: '0.95rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>уволено</span>
                                                    </h3>
                                                </div>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button 
                                                        type="button" 
                                                        className="btn-primary" 
                                                        onClick={handleRecycleFreak} 
                                                        style={{ height: '48px', padding: '0 20px', borderRadius: '8px', background: 'linear-gradient(135deg, #1C1C24 0%, #3A3A4A 100%)', color: '#fff', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}
                                                    >
                                                        <i className="fa-solid fa-user-slash"></i>
                                                        +1 Уволен (!уволен)
                                                    </button>
                                                    <button 
                                                        type="button" 
                                                        className="btn-secondary" 
                                                        onClick={handleResetRecycle}
                                                        style={{ height: '48px', color: 'var(--accent-rose)', border: '1px solid rgba(185, 60, 60, 0.15)', background: 'rgba(185, 60, 60, 0.05)', padding: '0 16px', borderRadius: '8px', cursor: 'pointer' }}
                                                        title="Сбросить счетчик"
                                                    >
                                                        <i className="fa-solid fa-arrows-rotate"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </section>
                                </div>

                                {/* Right Column: Real Twitch Chat Integration & Discord Embed Announcer */}
                                <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '1.5rem', minWidth: '300px' }}>
                                    
                                    {/* Real-time Twitch Chat Client */}
                                    <section className="cyber-panel" style={{ display: 'flex', flexDirection: 'column' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '10px' }}>
                                            <h2 style={{ fontSize: '1.1rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--primary-neon)', margin: 0 }}>
                                                <i className="fa-brands fa-twitch" style={{ marginRight: '8px', color: '#6441A5' }}></i>
                                                Чат трансляции Twitch Live
                                            </h2>
                                            <span className="badge-media-gold" style={{ background: 'rgba(100, 65, 165, 0.06)', color: '#6441A5', border: '1px solid rgba(100, 65, 165, 0.2)' }}>
                                                ИИ Модератор
                                            </span>
                                        </div>

                                        {/* Twitch Connection Form Group */}
                                        <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem' }}>
                                            <input 
                                                type="text"
                                                className="input-glow"
                                                placeholder="Имя Twitch канала (e.g. moriarty)"
                                                value={twitchChannel}
                                                onChange={(e) => setTwitchChannel(e.target.value)}
                                                disabled={isTwitchConnected}
                                                style={{ flexGrow: 1, height: '40px' }}
                                            />
                                            {isTwitchConnected ? (
                                                <button 
                                                    type="button" 
                                                    onClick={disconnectTwitch} 
                                                    className="btn-secondary"
                                                    style={{ height: '40px', color: 'var(--accent-rose)', border: '1px solid rgba(185,60,60,0.2)', padding: '0 16px', borderRadius: '8px', cursor: 'pointer' }}
                                                >
                                                    <i className="fa-solid fa-plug-circle-xmark"></i>
                                                </button>
                                            ) : (
                                                <button 
                                                    type="button" 
                                                    onClick={() => connectToTwitch(twitchChannel)} 
                                                    className="btn-primary"
                                                    style={{ height: '40px', background: '#6441A5', color: '#fff', border: 'none', padding: '0 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
                                                >
                                                    Подключить
                                                </button>
                                            )}
                                        </div>
                                        
                                        {/* Live Chat scroller container */}
                                        <div className="live-chat-panel" style={{ height: '360px', background: 'rgba(255, 255, 255, 0.5)', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.04)' }}>
                                            <div className="live-chat-scroller">
                                                {streamChatMessages.length === 0 ? (
                                                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', opacity: 0.7, padding: '2rem', textAlign: 'center' }}>
                                                        <i className="fa-brands fa-twitch animate-pulse" style={{ fontSize: '2.5rem', color: '#6441A5', marginBottom: '0.8rem' }}></i>
                                                        <p style={{ fontSize: '0.82rem', margin: 0 }}>Введите имя канала выше и подключитесь к трансляции чата Twitch!</p>
                                                    </div>
                                                ) : (
                                                    streamChatMessages.map((msg) => (
                                                        <div key={msg.id} className={`stream-chat-msg ${msg.isToxic ? 'toxic' : ''} ${msg.isSystem ? 'system' : ''}`} style={{ borderBottom: '1px solid rgba(0,0,0,0.015)' }}>
                                                            {!msg.isSystem && (
                                                                <span className="stream-platform-icon twitch">
                                                                    <i className="fa-brands fa-twitch"></i>
                                                                </span>
                                                            )}
                                                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>[{msg.timestamp}]</span>
                                                            {msg.isSystem ? (
                                                                <span style={{ color: 'var(--primary-neon)', fontStyle: 'italic', fontWeight: '500' }}>{msg.text}</span>
                                                            ) : (
                                                                <>
                                                                    <span className="stream-chat-author" style={{ color: '#6441A5' }}>{msg.author}:</span>
                                                                    <span className="stream-chat-text">{msg.text}</span>
                                                                    {msg.isToxic && (
                                                                        <span className="toxic-badge">Фрик</span>
                                                                    )}
                                                                </>
                                                            )}
                                                        </div>
                                                    ))
                                                )}
                                                <div ref={chatEndRef} />
                                            </div>
                                        </div>

                                        {/* AI Toxicity logs ticker */}
                                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '1rem', padding: '12px', background: 'rgba(185, 60, 60, 0.04)', borderRadius: '8px', border: '1px solid rgba(185, 60, 60, 0.1)', fontSize: '0.78rem' }}>
                                            <i className="fa-solid fa-circle-exclamation" style={{ color: 'var(--accent-rose)' }}></i>
                                            <span style={{ color: 'var(--text-bright)' }}>
                                                <strong>Авто-Модерация ИИ:</strong> Заблокировано спам-комментариев и сообщений от фриков: <strong>{streamModerationLogs.length}</strong>
                                            </span>
                                        </div>
                                    </section>

                                    {/* Webhook Discord Announcer */}
                                    <section className="cyber-panel">
                                        <h2 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1.2rem', textTransform: 'uppercase', color: 'var(--primary-neon)' }}>
                                            <i className="fa-brands fa-discord" style={{ marginRight: '8px', color: '#5865f2' }}></i>
                                            Enterprise Discord-Анонсер
                                        </h2>
                                        
                                        <form onSubmit={handlePostAnnouncement} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            <div className="form-group">
                                                <label style={{ fontSize: '0.78rem', fontWeight: '600' }}>Discord Webhook URL</label>
                                                <input 
                                                    type="url" 
                                                    className="input-glow" 
                                                    placeholder="https://discord.com/api/webhooks/..." 
                                                    value={discordWebhook}
                                                    onChange={(e) => setDiscordWebhook(e.target.value)}
                                                    style={{ height: '38px', marginTop: '5px' }}
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label style={{ fontSize: '0.78rem', fontWeight: '600' }}>Заголовок оповещения</label>
                                                <input 
                                                    type="text" 
                                                    className="input-glow" 
                                                    placeholder="Стрим запущен!" 
                                                    value={streamTitle}
                                                    onChange={(e) => setStreamTitle(e.target.value)}
                                                    required
                                                    style={{ height: '38px', marginTop: '5px' }}
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label style={{ fontSize: '0.78rem', fontWeight: '600' }}>Текст описания анонса</label>
                                                <textarea 
                                                    rows="3" 
                                                    className="input-glow" 
                                                    placeholder="Описание стрима..." 
                                                    value={streamDesc}
                                                    onChange={(e) => setStreamDesc(e.target.value)}
                                                    required
                                                    style={{ marginTop: '5px', padding: '10px' }}
                                                />
                                            </div>

                                            <button 
                                                type="submit" 
                                                className="btn-primary" 
                                                disabled={announcementStatus === 'sending' || !discordWebhook} 
                                                style={{ width: '100%', height: '42px', marginTop: '5px', borderRadius: '8px', background: 'linear-gradient(135deg, #5865f2 0%, #4752c4 100%)', border: 'none', color: '#fff', fontWeight: '600', cursor: 'pointer' }}
                                            >
                                                {announcementStatus === 'sending' ? (
                                                    <>
                                                        <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>
                                                        Рассылка красивых эмбедов...
                                                    </>
                                                ) : announcementStatus === 'success' ? (
                                                    <>
                                                        <i className="fa-solid fa-circle-check" style={{ marginRight: '8px' }}></i>
                                                        Анонс успешно опубликован!
                                                    </>
                                                ) : (
                                                    <>
                                                        <i className="fa-solid fa-paper-plane" style={{ marginRight: '8px' }}></i>
                                                        Запустить анонс трансляции
                                                    </>
                                                )}
                                            </button>
                                        </form>
                                    </section>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 7. SETTINGS & ACCOUNT MANAGEMENT TAB */}
                <div className={`tab-panel ${activeTab === 'settings' ? 'active' : ''}`}>
                    <div style={{ maxWidth: '950px', margin: '0 auto' }}>
                        
                        {/* Sub-tab selection menu with secret admin lock */}
                        <div className="settings-tab-bar">
                            <div className="settings-tabs-left">
                                <button 
                                    type="button"
                                    className={`settings-tab-btn ${settingsSubTab === 'account' ? 'active' : ''}`}
                                    onClick={() => setSettingsSubTab('account')}
                                >
                                    <i className="fa-solid fa-user-gear"></i>
                                    <span>Настройки Аккаунта</span>
                                </button>
                                <button 
                                    type="button"
                                    className={`settings-tab-btn ${settingsSubTab === 'api' ? 'active' : ''}`}
                                    onClick={() => setSettingsSubTab('api')}
                                >
                                    <i className="fa-solid fa-network-wired"></i>
                                    <span>Подключения API</span>
                                </button>
                            </div>

                            {/* Hidden Key Lock only for OWNER/DEV */}
                            {isOwnerOrDev && (
                                <button
                                    type="button"
                                    className={`settings-secret-admin-btn ${settingsSubTab === 'admin' ? 'active' : ''}`}
                                    onClick={() => {
                                        if (settingsSubTab === 'admin') {
                                            setSettingsSubTab('account');
                                            addToast("Панель администратора заблокирована.", "info");
                                        } else {
                                            setSettingsSubTab('admin');
                                            addToast("[СИСТЕМА] Доступ разрешен. Панель OWNER/DEV разблокирована!", "success");
                                        }
                                    }}
                                    title="Вход в секретную панель управления (OWNER/DEV)"
                                >
                                    <i className={`fa-solid ${settingsSubTab === 'admin' ? 'fa-lock-open' : 'fa-lock'}`}></i>
                                </button>
                            )}
                        </div>

                        {/* SUB-PANEL 1: ACCOUNT SETTINGS */}
                        {settingsSubTab === 'account' && (
                            <div className="account-settings-container animate-fade-in">
                                
                                {/* Left column: Avatar & Profile Info */}
                                <div className="glass-panel glow-purple" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                                    <div className="avatar-large-container">
                                        <div className="avatar-rotating-ring"></div>
                                        <div 
                                            className="avatar-container-wrap" 
                                            onClick={() => {
                                                setCustomAvatarUrl(activeProfile.discord?.avatar || '');
                                                setShowAvatarModal(true);
                                            }}
                                            title="Сменить аватарку"
                                        >
                                            <div className="avatar-large" style={{ width: '130px', height: '130px', margin: 0 }}>
                                                <img src={activeProfile.discord?.avatar || getProceduralAvatar(activeProfile.character_name)} alt="Av" />
                                            </div>
                                            <div className="avatar-edit-overlay" style={{ borderRadius: '12px' }}>
                                                <i className="fa-solid fa-gear"></i>
                                            </div>
                                        </div>
                                    </div>

                                    <h2 className="char-title" style={{ fontSize: '1.6rem', marginBottom: '4px' }}>{activeProfile.character_name}</h2>
                                    <span className="char-static" style={{ color: 'var(--primary)', fontWeight: '700', fontSize: '0.9rem', display: 'block', marginBottom: '12px' }}>CID: {activeProfile.static_id}</span>
                                    
                                    {/* Clickable Role Badge shortcut for OWNER/DEV */}
                                    <span 
                                        className={`user-role-badge-interactive ${isOwnerOrDev ? 'interactive' : ''}`}
                                        onClick={() => {
                                            if (isOwnerOrDev) {
                                                if (settingsSubTab === 'admin') {
                                                    setSettingsSubTab('account');
                                                    addToast("Панель администратора заблокирована.", "info");
                                                } else {
                                                    setSettingsSubTab('admin');
                                                    addToast("[СИСТЕМА] Доступ разрешен. Панель OWNER/DEV разблокирована!", "success");
                                                }
                                            }
                                        }}
                                        title={isOwnerOrDev ? "Нажмите, чтобы разблокировать Панель OWNER/DEV" : undefined}
                                    >
                                        {activeProfile.role}
                                    </span>
                                    
                                    <button 
                                        type="button" 
                                        className="btn-primary" 
                                        style={{ marginTop: '2rem', width: '100%', fontSize: '0.85rem' }} 
                                        onClick={() => {
                                            setCustomAvatarUrl(activeProfile.discord?.avatar || '');
                                            setShowAvatarModal(true);
                                        }}
                                    >
                                        <i className="fa-solid fa-image" style={{ marginRight: '8px' }}></i>
                                        Сменить Аватарку
                                    </button>

                                    {/* Discord Account Binding Module */}
                                    <div style={{ marginTop: '1.5rem', width: '100%', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem' }}>
                                        {activeProfile.discord && activeProfile.discord.id ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', background: 'rgba(88, 101, 242, 0.08)', border: '1px solid rgba(88, 101, 242, 0.2)', padding: '12px', borderRadius: '10px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', justifyContent: 'center' }}>
                                                    <i className="fa-brands fa-discord" style={{ color: '#5865f2', fontSize: '1.2rem' }}></i>
                                                    <span style={{ fontSize: '0.82rem', fontWeight: 'bold' }}>{activeProfile.discord.username}</span>
                                                    <span style={{ fontSize: '0.65rem', background: '#5865f2', color: '#fff', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 'bold' }}>Связан</span>
                                                </div>
                                                <button 
                                                    type="button" 
                                                    className="btn-secondary" 
                                                    style={{ border: '1px solid #ff4d4f', color: '#ff4d4f', fontSize: '0.75rem', padding: '4px 10px', marginTop: '4px', width: '100%' }}
                                                    onClick={handleUnlinkDiscord}
                                                    disabled={loading}
                                                >
                                                    Отвязать Discord
                                                </button>
                                            </div>
                                        ) : (
                                            <button 
                                                type="button" 
                                                className="btn-discord" 
                                                style={{ width: '100%', fontSize: '0.82rem', padding: '10px', background: 'linear-gradient(135deg, #5865f2 0%, #4752c4 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', border: 'none', color: '#fff', cursor: 'pointer', borderRadius: '8px' }}
                                                onClick={handleLinkDiscord}
                                                disabled={loading}
                                            >
                                                <i className="fa-brands fa-discord"></i>
                                                <span>Привязать Discord</span>
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Right column: Change Email, password and Self delete */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                    
                                    {/* Change Email Form */}
                                    <div className="glass-panel">
                                        <h3 style={{ marginBottom: '1rem', fontSize: '1.05rem' }}>Смена Почты</h3>
                                        <form onSubmit={handleEmailUpdate}>
                                            <div className="form-group">
                                                <label>Текущий Email</label>
                                                <input type="text" className="input-glow" value={activeProfile.email || ''} disabled style={{ opacity: 0.6 }} />
                                            </div>
                                            <div className="form-group">
                                                <label>Новый Email</label>
                                                <input 
                                                    type="email" 
                                                    className="input-glow" 
                                                    placeholder="new@moriarty.fam" 
                                                    value={newEmail} 
                                                    onChange={(e) => setNewEmail(e.target.value)} 
                                                    required 
                                                />
                                            </div>
                                            <button type="submit" className="btn-secondary" style={{ width: '100%' }} disabled={loading}>
                                                Изменить почту
                                            </button>
                                        </form>
                                    </div>

                                    {/* Change Password Form */}
                                    <div className="glass-panel">
                                        <h3 style={{ marginBottom: '1rem', fontSize: '1.05rem' }}>Смена Пароля</h3>
                                        <form onSubmit={handlePasswordUpdate}>
                                            <div className="form-group">
                                                <label>Новый пароль</label>
                                                <input 
                                                    type="password" 
                                                    className="input-glow" 
                                                    placeholder="••••••••" 
                                                    value={newPassword} 
                                                    onChange={(e) => setNewPassword(e.target.value)} 
                                                    required 
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>Подтвердите пароль</label>
                                                <input 
                                                    type="password" 
                                                    className="input-glow" 
                                                    placeholder="••••••••" 
                                                    value={confirmPassword} 
                                                    onChange={(e) => setConfirmPassword(e.target.value)} 
                                                    required 
                                                />
                                            </div>
                                            <button type="submit" className="btn-secondary" style={{ width: '100%' }} disabled={loading}>
                                                Обновить пароль
                                            </button>
                                        </form>
                                    </div>

                                    {/* Danger Zone: Account Deletion */}
                                    <div className="glass-panel" style={{ border: '1px solid rgba(223, 71, 71, 0.3)', boxShadow: '0 10px 30px rgba(223,71,71,0.05)' }}>
                                        <h3 style={{ marginBottom: '0.5rem', fontSize: '1.05rem', color: 'var(--danger)' }}>Опасная Зона</h3>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.2rem', lineHeight: '1.4' }}>
                                            Удаление аккаунта навсегда сотрет вашего персонажа из архивов синдиката. Восстановление невозможно!
                                        </p>
                                        <button 
                                            type="button" 
                                            className="btn-secondary" 
                                            style={{ width: '100%', borderColor: 'var(--danger)', color: 'var(--danger)' }} 
                                            onClick={() => triggerConfirm(
                                                "Удаление собственного аккаунта",
                                                "ВНИМАНИЕ! Вы собираетесь навсегда удалить свою учетную запись бойца из базы данных синдиката Moriarty. Все ваши сейфовые средства, история транзакций и выговоры будут безвозвратно стерты. Вы абсолютно уверены?",
                                                handleSelfDelete,
                                                "Стереть аккаунт навсегда",
                                                "Отмена"
                                            )}
                                            disabled={loading}
                                        >
                                            <i className="fa-solid fa-trash-can" style={{ marginRight: '8px' }}></i>
                                            Удалить аккаунт навсегда
                                        </button>
                                    </div>

                                </div>
                            </div>
                        )}

                        {/* SUB-PANEL 2: API CONNECTIONS */}
                        {settingsSubTab === 'api' && (
                            <div className="glass-panel glow-purple animate-fade-in" style={{ maxWidth: '650px', margin: '0 auto' }}>
                                <h3 style={{ marginBottom: '1rem' }}><i className="fa-solid fa-network-wired" style={{ marginRight: '10px', color: 'var(--primary)' }}></i>Связующий Центр Кабинета</h3>
                                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.8rem', lineHeight: '1.6' }}>
                                    Кабинет спроектирован по гибридному стандарту. По умолчанию он работает на <strong>Demo-Mode</strong> (локальный файл <code>demo_db.json</code>). 
                                    Укажите параметры Supabase и ключ Gemini ниже, чтобы мгновенно развернуть полноценную облачную базу данных со встроенным искусственным интеллектом!
                                </p>

                                <form onSubmit={handleConfigSave}>
                                    <div className="form-group">
                                        <label>Supabase Project URL</label>
                                        <input 
                                            type="text" 
                                            className="input-glow" 
                                            placeholder="https://xxxxxxxxx.supabase.co"
                                            value={config.supabaseUrl}
                                            onChange={(e) => setConfig({ ...config, supabaseUrl: e.target.value })}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Supabase Anon Key</label>
                                        <input 
                                            type="password" 
                                            className="input-glow" 
                                            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                                            value={config.supabaseAnonKey}
                                            onChange={(e) => setConfig({ ...config, supabaseAnonKey: e.target.value })}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Google Gemini API Key</label>
                                        <input 
                                            type="password" 
                                            className="input-glow" 
                                            placeholder="AIzaSy..."
                                            value={config.geminiApiKey}
                                            onChange={(e) => setConfig({ ...config, geminiApiKey: e.target.value })}
                                        />
                                        <small className="help-text">Используется для живого разума личного раба Володи</small>
                                    </div>

                                    <div className="form-group">
                                        <label>Discord OAuth2 Client ID</label>
                                        <input 
                                            type="text" 
                                            className="input-glow" 
                                            placeholder="123456789012345678"
                                            value={config.discordClientId}
                                            onChange={(e) => setConfig({ ...config, discordClientId: e.target.value })}
                                        />
                                    </div>

                                    <div className="form-group" style={{ marginBottom: '2.2rem' }}>
                                        <label>Discord Client Secret</label>
                                        <input 
                                            type="password" 
                                            className="input-glow" 
                                            placeholder="скрыто во благо безопасности"
                                            value={config.discordClientSecret}
                                            onChange={(e) => setConfig({ ...config, discordClientSecret: e.target.value })}
                                        />
                                    </div>

                                    <div style={{ display: 'flex', gap: '14px' }}>
                                        <button type="submit" className="btn-primary" style={{ flex: '2' }} disabled={loading}>
                                            {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : 'Подключить и обновить'}
                                        </button>
                                        <button type="button" className="btn-secondary" style={{ flex: '1', color: 'var(--danger)' }} onClick={handleConfigReset} disabled={loading}>
                                            Сбросить
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* SUB-PANEL 3: OWNER/DEV ADMIN CONTROLS */}
                        {isOwnerOrDev && settingsSubTab === 'admin' && (
                            <div className="animate-fade-in">
                                {/* Admin Inner Navigation Subtabs */}
                                <div className="admin-inner-nav" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '15px' }}>
                                    <button 
                                        type="button"
                                        className={`settings-tab-btn ${adminSubTab === 'users' ? 'active' : ''}`}
                                        onClick={() => setAdminSubTab('users')}
                                        style={{ fontSize: '0.8rem', padding: '8px 16px' }}
                                    >
                                        <i className="fa-solid fa-users" style={{ marginRight: '6px' }}></i>
                                        Бойцы & Выговоры
                                    </button>
                                    <button 
                                        type="button"
                                        className={`settings-tab-btn ${adminSubTab === 'treasury' ? 'active' : ''}`}
                                        onClick={() => setAdminSubTab('treasury')}
                                        style={{ fontSize: '0.8rem', padding: '8px 16px' }}
                                    >
                                        <i className="fa-solid fa-vault" style={{ marginRight: '6px' }}></i>
                                        Запросы в казну {treasuryRequests.filter(r => r.status === 'PENDING').length > 0 && (
                                            <span style={{ background: 'var(--primary)', color: '#000', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '50%', fontWeight: 'bold', marginLeft: '4px' }}>
                                                {treasuryRequests.filter(r => r.status === 'PENDING').length}
                                            </span>
                                        )}
                                    </button>
                                    <button 
                                        type="button"
                                        className={`settings-tab-btn ${adminSubTab === 'feedback' ? 'active' : ''}`}
                                        onClick={() => setAdminSubTab('feedback')}
                                        style={{ fontSize: '0.8rem', padding: '8px 16px' }}
                                    >
                                        <i className="fa-solid fa-comments" style={{ marginRight: '6px' }}></i>
                                        Обратная связь {allFeedbacks.filter(f => f.status === 'PENDING').length > 0 && (
                                            <span style={{ background: 'var(--primary)', color: '#000', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '50%', fontWeight: 'bold', marginLeft: '4px' }}>
                                                {allFeedbacks.filter(f => f.status === 'PENDING').length}
                                            </span>
                                        )}
                                    </button>
                                    <button 
                                        type="button"
                                        className={`settings-tab-btn ${adminSubTab === 'volodya' ? 'active' : ''}`}
                                        onClick={() => setAdminSubTab('volodya')}
                                        style={{ fontSize: '0.8rem', padding: '8px 16px' }}
                                    >
                                        <i className="fa-solid fa-brain" style={{ marginRight: '6px' }}></i>
                                        Разум Володи
                                    </button>
                                </div>

                                {/* TAB 1: USERS DATABASE & WARNS DOSSIER */}
                                {adminSubTab === 'users' && (
                                    <div className="admin-grid animate-fade-in">
                                        {/* User List Panel */}
                                        <div className="glass-panel admin-list-wrap">
                                            <h3>База Людей</h3>
                                            <div className="search-bar-wrap">
                                                <i className="fa-solid fa-magnifying-glass"></i>
                                                <input 
                                                    type="text" 
                                                    className="input-glow search-input" 
                                                    placeholder="Поиск по имени / CID..."
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                />
                                            </div>
                                            
                                            <div className="admin-users-list">
                                                {adminUsers
                                                    .filter(u => u.character_name.toLowerCase().includes(searchQuery.toLowerCase()) || u.static_id.includes(searchQuery))
                                                    .map(u => (
                                                        <div 
                                                            key={u.id} 
                                                            className={`admin-user-card ${selectedAdminUser?.id === u.id ? 'active' : ''}`}
                                                            onClick={() => selectAdminUser(u)}
                                                        >
                                                            <div className="admin-user-left">
                                                                <div className="admin-user-avatar">
                                                                    <img src={u.discord?.avatar || getProceduralAvatar(u.character_name)} alt="Av" />
                                                                </div>
                                                                <div className="admin-user-info">
                                                                    <span className="admin-user-name">{u.character_name}</span>
                                                                    <span className="admin-user-static">CID: {u.static_id}</span>
                                                                </div>
                                                            </div>
                                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                                                <span className={`admin-user-role-badge ${u.role.toLowerCase()}`}>
                                                                    {u.role}
                                                                </span>
                                                                {u.is_media && (
                                                                    <span className="badge-media-gold" style={{ fontSize: '0.55rem', padding: '2px 6px' }}>
                                                                        <i className="fa-solid fa-star"></i> MEDIA
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))
                                                }
                                            </div>
                                        </div>

                                        {/* User stats edit and Warnings Dossier */}
                                        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                            {selectedAdminUser ? (
                                                <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                                    {/* Profile Header */}
                                                    <div className="admin-details-header">
                                                        <div className="details-avatar-huge">
                                                            <img src={selectedAdminUser.discord?.avatar || getProceduralAvatar(selectedAdminUser.character_name)} alt="Av" />
                                                        </div>
                                                        <div className="details-info-wrap">
                                                            <span className="details-name">{selectedAdminUser.character_name}</span>
                                                            <span className="details-static">CID персонажа: {selectedAdminUser.static_id}</span>
                                                        </div>
                                                    </div>

                                                    <form onSubmit={handleAdminSaveUser} className="admin-details-form" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                                        <div className="form-group">
                                                            <label>Уровень прав (Семейная Роль)</label>
                                                            <select 
                                                                className="input-glow" 
                                                                value={editRole}
                                                                onChange={(e) => setEditRole(e.target.value)}
                                                                style={{ cursor: 'pointer' }}
                                                            >
                                                                <option value="MEMBER">MEMBER (Рядовой)</option>
                                                                <option value="MODERATOR">MODERATOR (Старший состав)</option>
                                                                <option value="Developer">Developer (Тех-админ)</option>
                                                                <option value="OWNER">OWNER (Глава семьи)</option>
                                                            </select>
                                                        </div>

                                                        <div className="form-group">
                                                            <label>Количество выговоров ({editWarns} / 3)</label>
                                                            <input 
                                                                type="number" 
                                                                className="input-glow"
                                                                min="0" 
                                                                max="3"
                                                                value={editWarns} 
                                                                onChange={(e) => setEditWarns(e.target.value)}
                                                            />
                                                        </div>

                                                        <div className="form-group">
                                                            <label>Личный сейф ($)</label>
                                                            <input 
                                                                type="number" 
                                                                className="input-glow" 
                                                                value={editBalance} 
                                                                onChange={(e) => setEditBalance(e.target.value)}
                                                            />
                                                        </div>

                                                        <div className="form-group" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 0' }}>
                                                             <div className="switch-label-wrap">
                                                                 <span className="switch-title" style={{ fontSize: '0.88rem', fontWeight: '600' }}>Media-статус</span>
                                                                 <span className="switch-desc" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Дает доступ к Кабинету Стримера</span>
                                                             </div>
                                                             <label className="switch">
                                                                 <input 
                                                                     type="checkbox" 
                                                                     checked={editIsMedia} 
                                                                     onChange={(e) => setEditIsMedia(e.target.checked)} 
                                                                 />
                                                                 <span className="slider"></span>
                                                             </label>
                                                         </div>

                                                         <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                            <button type="submit" className="btn-primary" disabled={loading}>
                                                                {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : 'Сохранить изменения'}
                                                            </button>
                                                            <button 
                                                                type="button" 
                                                                className="btn-secondary" 
                                                                style={{ border: '1px solid var(--danger)', color: 'var(--danger)' }}
                                                                onClick={() => handleAdminDeleteUser(selectedAdminUser.id)}
                                                                disabled={loading}
                                                            >
                                                                <i className="fa-solid fa-trash-can" style={{ marginRight: '8px' }}></i>
                                                                Исключить / Удалить аккаунт
                                                            </button>
                                                        </div>
                                                    </form>

                                                    <hr style={{ borderColor: 'rgba(255,255,255,0.05)', margin: '10px 0' }} />

                                                    {/* Tactical Warning Dossier Module */}
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                                        <h3 style={{ fontSize: '1.05rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <i className="fa-solid fa-gavel"></i>
                                                            Дисциплинарное досье
                                                        </h3>

                                                        {/* Issue warning form */}
                                                        <form onSubmit={handleIssueWarn} style={{ background: 'rgba(0,0,0,0.15)', padding: '15px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                                            <div className="form-group">
                                                                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Выдать новое взыскание (Выговор)</label>
                                                                <input 
                                                                    type="text" 
                                                                    className="input-glow" 
                                                                    placeholder="Причина выговора, например: НУС / Прогул строя" 
                                                                    value={warnReason}
                                                                    onChange={(e) => setWarnReason(e.target.value)}
                                                                    required
                                                                />
                                                            </div>
                                                            <button type="submit" className="btn-primary" style={{ width: '100%', padding: '6px', fontSize: '0.8rem', marginTop: '5px' }} disabled={loading}>
                                                                {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : 'Записать взыскание'}
                                                            </button>
                                                        </form>

                                                        {/* Selected User Warnings List */}
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>История взысканий бойца</label>
                                                            {selectedUserWarns.length === 0 ? (
                                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '10px' }}>
                                                                    Чистое личное дело
                                                                </div>
                                                            ) : (
                                                                selectedUserWarns.map((w) => (
                                                                    <div key={w.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255, 255, 255, 0.02)', padding: '10px', borderRadius: '6px', borderLeft: `3px solid ${w.status === 'ACTIVE' ? 'var(--danger)' : 'var(--text-muted)'}`, fontSize: '0.82rem' }}>
                                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                                                            <span style={{ fontWeight: '600', color: w.status === 'ACTIVE' ? 'var(--text-bright)' : 'var(--text-muted)' }}>
                                                                                {w.reason}
                                                                            </span>
                                                                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                                                                Выдал: {w.issued_by} | {formatDate(w.issued_at)}
                                                                            </span>
                                                                            <span style={{ fontSize: '0.7rem', color: w.status === 'ACTIVE' ? 'var(--danger)' : 'var(--text-muted)', fontWeight: 'bold' }}>
                                                                                {w.status === 'ACTIVE' ? 'АКТИВЕН' : 'СНЯТ / ИСТЕК'}
                                                                            </span>
                                                                        </div>
                                                                        {w.status === 'ACTIVE' && (
                                                                            <button 
                                                                                type="button" 
                                                                                className="btn-secondary" 
                                                                                style={{ padding: '4px 8px', fontSize: '0.72rem', border: '1px solid var(--primary)', color: 'var(--primary)' }}
                                                                                onClick={() => handleLiftWarn(w.id, w.reason)}
                                                                                disabled={loading}
                                                                            >
                                                                                Снять
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                ))
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="empty-state" style={{ height: '300px' }}>
                                                    <i className="fa-solid fa-user-gear"></i>
                                                    <p>Выберите персонажа из списка для администрирования</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* TAB 2: TREASURY REQUESTS MANAGER */}
                                {adminSubTab === 'treasury' && (
                                    <div className="glass-panel animate-fade-in" style={{ padding: '2rem' }}>
                                        <h3 style={{ marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <i className="fa-solid fa-vault" style={{ color: 'var(--primary)' }}></i>
                                            Управление заявками в Казну
                                        </h3>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
                                            Здесь отображаются все поданные членами семьи запросы на пополнение и вывод средств. Рассмотрите их, укажите вердикт и подтвердите перевод.
                                        </p>

                                        {/* Admin Treasury request review form / input comment */}
                                        <div className="form-group" style={{ marginBottom: '2rem', maxWidth: '500px' }}>
                                            <label style={{ fontSize: '0.85rem' }}>Общий комментарий к вердикту (необязательно)</label>
                                            <input 
                                                type="text" 
                                                className="input-glow" 
                                                placeholder="Причина одобрения / отказа, например: Отчет принят / Недостаточно доказательств взноса"
                                                value={adminTreasuryComment}
                                                onChange={(e) => setAdminTreasuryComment(e.target.value)}
                                            />
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                            {treasuryRequests.length === 0 ? (
                                                <div className="empty-state" style={{ padding: '3rem 1rem' }}>
                                                    <i className="fa-solid fa-circle-check" style={{ color: 'var(--primary)' }}></i>
                                                    <p>Все заявки в казну обработаны!</p>
                                                </div>
                                            ) : (
                                                treasuryRequests.map((req) => (
                                                    <div 
                                                        key={req.id} 
                                                        style={{ 
                                                            display: 'flex', 
                                                            flexDirection: 'column', 
                                                            gap: '12px', 
                                                            padding: '20px', 
                                                            borderRadius: '12px', 
                                                            background: 'rgba(255,255,255,0.02)', 
                                                            border: '1px solid rgba(255,255,255,0.05)',
                                                            borderLeft: `4px solid ${req.status === 'PENDING' ? 'var(--primary)' : req.status === 'APPROVED' ? '#52c41a' : '#ff4d4f'}`
                                                        }}
                                                    >
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                                <span style={{ fontSize: '1.05rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                    <i className={`fa-solid ${req.type === 'DEPOSIT' ? 'fa-arrow-down' : 'fa-arrow-up'}`} style={{ color: req.type === 'DEPOSIT' ? 'var(--primary)' : 'var(--danger)' }}></i>
                                                                    {req.type === 'DEPOSIT' ? 'ВЗНОС' : 'ВЫДАЧА'}
                                                                </span>
                                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>от {req.character_name} (CID: {req.static_id})</span>
                                                            </div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                                <span style={{ fontSize: '1.15rem', fontWeight: 'bold', color: 'var(--text-bright)' }}>{formatCurrency(req.amount)}</span>
                                                                <span className={`status-badge ${req.status.toLowerCase()}`} style={{ fontSize: '0.72rem', padding: '4px 8px', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 'bold' }}>
                                                                    {req.status === 'PENDING' ? 'Ожидает' : req.status === 'APPROVED' ? 'Одобрен' : 'Отклонен'}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {req.description && (
                                                            <div style={{ fontSize: '0.85rem', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '6px', borderLeft: '3px solid var(--primary)', color: 'var(--text-bright)' }}>
                                                                <strong>Обоснование:</strong> {req.description}
                                                            </div>
                                                        )}

                                                        {req.admin_comment && (
                                                            <div style={{ fontSize: '0.82rem', padding: '4px 0', color: 'var(--primary)', fontStyle: 'italic' }}>
                                                                <strong>Админ-комментарий:</strong> {req.admin_comment}
                                                            </div>
                                                        )}

                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginTop: '5px' }}>
                                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Подан: {formatDate(req.created_at)}</span>
                                                            {req.status === 'PENDING' && (
                                                                <div style={{ display: 'flex', gap: '10px' }}>
                                                                    <button 
                                                                        type="button" 
                                                                        className="btn-primary" 
                                                                        style={{ padding: '6px 16px', fontSize: '0.8rem', background: '#52c41a', borderColor: '#52c41a', color: '#fff' }}
                                                                        onClick={() => handleApproveTreasuryRequest(req.id)}
                                                                        disabled={loading}
                                                                    >
                                                                        Одобрить
                                                                    </button>
                                                                    <button 
                                                                        type="button" 
                                                                        className="btn-secondary" 
                                                                        style={{ padding: '6px 16px', fontSize: '0.8rem', border: '1px solid #ff4d4f', color: '#ff4d4f' }}
                                                                        onClick={() => handleRejectTreasuryRequest(req.id)}
                                                                        disabled={loading}
                                                                    >
                                                                        Отклонить
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* TAB 3: FEEDBACK RESOLUTION BOARD */}
                                {adminSubTab === 'feedback' && (
                                    <div className="glass-panel animate-fade-in" style={{ padding: '2rem' }}>
                                        <h3 style={{ marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <i className="fa-solid fa-comments" style={{ color: 'var(--primary)' }}></i>
                                            Обращения & Обратная связь
                                        </h3>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
                                            Рассмотрите жалобы и предложения участников синдиката, напишите развернутый ответ и закройте обращение.
                                        </p>

                                        {/* Global reply input comment */}
                                        <div className="form-group" style={{ marginBottom: '2rem', maxWidth: '500px' }}>
                                            <label style={{ fontSize: '0.85rem' }}>Ответ на обращение (вердикт)</label>
                                            <textarea 
                                                className="input-glow textarea-prompt" 
                                                placeholder="Введите ответ / вердикт на обращение бойца..."
                                                value={adminReplyText}
                                                onChange={(e) => setAdminReplyText(e.target.value)}
                                                style={{ height: '70px' }}
                                            ></textarea>
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                            {allFeedbacks.length === 0 ? (
                                                <div className="empty-state" style={{ padding: '3rem 1rem' }}>
                                                    <i className="fa-solid fa-circle-check" style={{ color: 'var(--primary)' }}></i>
                                                    <p>Обращения отсутствуют!</p>
                                                </div>
                                            ) : (
                                                allFeedbacks.map((fb) => (
                                                    <div 
                                                        key={fb.id} 
                                                        style={{ 
                                                            display: 'flex', 
                                                            flexDirection: 'column', 
                                                            gap: '12px', 
                                                            padding: '20px', 
                                                            borderRadius: '12px', 
                                                            background: 'rgba(255,255,255,0.02)', 
                                                            border: '1px solid rgba(255,255,255,0.05)',
                                                            borderLeft: `4px solid ${fb.status === 'PENDING' ? 'var(--primary)' : fb.status === 'APPROVED' ? '#52c41a' : '#ff4d4f'}`
                                                        }}
                                                    >
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                                <span style={{ fontSize: '1rem', fontWeight: 'bold', color: fb.type === 'COMPLAINT' ? 'var(--danger)' : '#1890ff' }}>
                                                                    <i className={`fa-solid ${fb.type === 'COMPLAINT' ? 'fa-triangle-exclamation' : 'fa-lightbulb'}`} style={{ marginRight: '6px' }}></i>
                                                                    {fb.type === 'COMPLAINT' ? 'ЖАЛОБА' : 'ПРЕДЛОЖЕНИЕ'}
                                                                </span>
                                                                {fb.target_member && (
                                                                    <span style={{ fontSize: '0.8rem', color: 'var(--danger)' }}>
                                                                        (на {fb.target_member})
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <span className={`status-badge ${fb.status.toLowerCase()}`} style={{ fontSize: '0.72rem', padding: '4px 8px', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 'bold' }}>
                                                                {fb.status === 'PENDING' ? 'Ожидает' : fb.status === 'APPROVED' ? 'Одобрено / Закрыто' : 'Отклонено'}
                                                            </span>
                                                        </div>

                                                        <div style={{ fontSize: '0.88rem', background: 'rgba(0,0,0,0.15)', padding: '12px', borderRadius: '6px', color: 'var(--text-bright)', lineHeight: '1.5' }}>
                                                            {fb.text}
                                                        </div>

                                                        {fb.admin_comment && (
                                                            <div style={{ fontSize: '0.82rem', padding: '10px', borderRadius: '6px', background: 'rgba(212,175,55,0.03)', border: '1px solid rgba(212,175,55,0.08)', color: 'var(--primary)', fontStyle: 'italic' }}>
                                                                <strong>Ответ администрации:</strong> {fb.admin_comment}
                                                            </div>
                                                        )}

                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginTop: '5px' }}>
                                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Автор ID: {fb.user_id} | {formatDate(fb.created_at)}</span>
                                                            {fb.status === 'PENDING' && (
                                                                <div style={{ display: 'flex', gap: '10px' }}>
                                                                    <button 
                                                                        type="button" 
                                                                        className="btn-primary" 
                                                                        style={{ padding: '6px 16px', fontSize: '0.8rem', background: '#52c41a', borderColor: '#52c41a', color: '#fff' }}
                                                                        onClick={() => handleReplyFeedback(fb.id, adminReplyText, 'APPROVED')}
                                                                        disabled={loading}
                                                                    >
                                                                        Принять & Закрыть
                                                                    </button>
                                                                    <button 
                                                                        type="button" 
                                                                        className="btn-secondary" 
                                                                        style={{ padding: '6px 16px', fontSize: '0.8rem', border: '1px solid #ff4d4f', color: '#ff4d4f' }}
                                                                        onClick={() => handleReplyFeedback(fb.id, adminReplyText, 'REJECTED')}
                                                                        disabled={loading}
                                                                    >
                                                                        Отклонить
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* TAB 4: SYSTEM PROMPT (VOLODYA RAZUM) */}
                                {adminSubTab === 'volodya' && (
                                    <div className="glass-panel glow-purple animate-fade-in" style={{ padding: '2rem' }}>
                                        <h3 style={{ marginBottom: '1rem' }}><i className="fa-solid fa-brain" style={{ marginRight: '10px', color: 'var(--primary)' }}></i>Прошивка Разума ИИ Володи (Промпт)</h3>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.2rem' }}>
                                            Доступно только ролям **OWNER** и **Developer**. Изменение этого промпта мгновенно перепрограммирует ИИ Володю на сервере!
                                        </p>
                                        <form onSubmit={handleAdminSavePrompt}>
                                            <textarea 
                                                className="input-glow textarea-prompt" 
                                                value={systemPrompt} 
                                                onChange={(e) => setSystemPrompt(e.target.value)}
                                                placeholder="Введите кастомный системный промпт для Gemini ИИ..."
                                                style={{ height: '200px' }}
                                            ></textarea>
                                            <button type="submit" className="btn-primary" style={{ marginTop: '1.2rem' }} disabled={loading}>
                                                {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : 'Записать в чип Володе'}
                                            </button>
                                        </form>
                                    </div>
                                )}
                            </div>
                        )}

                    </div>
                </div>

            </main>

            {/* DYNAMIC MODALS FOR BALANCE ACTIONS */}
            
            {/* Treasury Request Modal */}
            <div className={`modal-overlay ${showTreasuryRequestModal ? 'active' : ''}`}>
                <div className="modal-content glass-panel glow-purple" style={{ border: '1px solid var(--primary)', maxWidth: '460px', padding: '2.5rem' }}>
                    <div className="modal-header" style={{ marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
                        <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.25rem' }}>
                            <i className="fa-solid fa-vault" style={{ color: 'var(--primary)' }}></i>
                            Заявка в семейную казну
                        </h3>
                        <button className="modal-close" onClick={() => setShowTreasuryRequestModal(false)} style={{ background: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}>
                            <i className="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                    <form onSubmit={handleTreasuryRequestSubmit}>
                        <div className="form-group">
                            <label>Тип транзакции</label>
                            <select 
                                className="input-glow" 
                                value={reqType} 
                                onChange={(e) => setReqType(e.target.value)}
                                style={{ cursor: 'pointer' }}
                            >
                                <option value="DEPOSIT">ВЗНОС (Вложить в казну)</option>
                                <option value="WITHDRAW">ВЫДАЧА (Вывести из казны)</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Сумма ($)</label>
                            <input 
                                type="number" 
                                className="input-glow" 
                                placeholder="50000"
                                value={reqAmount}
                                onChange={(e) => setReqAmount(e.target.value)}
                                required
                                min="1"
                            />
                        </div>
                        <div className="form-group">
                            <label>Обоснование / Описание заявки</label>
                            <textarea 
                                className="input-glow textarea-prompt" 
                                placeholder="Опишите за что взнос / на какие цели выдача (например, доля со сбора / закупка бронежилетов)"
                                value={reqDescription}
                                onChange={(e) => setReqDescription(e.target.value)}
                                required
                                style={{ height: '80px' }}
                            ></textarea>
                        </div>
                        <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
                            {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : 'Отправить заявку'}
                        </button>
                    </form>
                </div>
            </div>

            {/* Transfer Modal */}
            <div className={`modal-overlay ${showTransferModal ? 'active' : ''}`}>
                <div className="modal-content">
                    <div className="modal-header">
                        <h3 className="modal-title">Семейный перевод</h3>
                        <button className="modal-close" onClick={() => setShowTransferModal(false)}>
                            <i className="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                    <form onSubmit={handleTransferSubmit}>
                        <div className="form-group">
                            <label>CID Получателя (Static ID)</label>
                            <input 
                                type="text" 
                                className="input-glow" 
                                placeholder="CID игрока, например 777"
                                value={transferTargetCid}
                                onChange={(e) => setTransferTargetCid(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Сумма перевода ($)</label>
                            <input 
                                type="number" 
                                className="input-glow" 
                                placeholder="10000"
                                value={transferAmount}
                                onChange={(e) => setTransferAmount(e.target.value)}
                                required
                                min="1"
                            />
                        </div>
                        <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
                            {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : 'Перевести'}
                        </button>
                    </form>
                </div>
            </div>

            {/* Custom Avatar Change Modal */}
            <div className={`modal-overlay ${showAvatarModal ? 'active' : ''}`}>
                <div className="modal-content glass-panel glow-purple" style={{ border: '2.5px solid var(--primary)', maxWidth: '460px', padding: '2.5rem' }}>
                    <div className="modal-header" style={{ marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
                        <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.25rem' }}>
                            <i className="fa-solid fa-image" style={{ color: 'var(--primary)' }}></i>
                            Сменить Аватарку
                        </h3>
                        <button className="modal-close" onClick={() => setShowAvatarModal(false)} style={{ background: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}>
                            <i className="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                    
                    <form onSubmit={handleAvatarUpdate}>
                        {/* PC File Upload wrapper */}
                        <div className="form-group">
                            <label>Загрузить файл с компьютера</label>
                            <div className="file-upload-glow-wrap">
                                <i className="fa-solid fa-cloud-arrow-up file-upload-icon animate-pulse"></i>
                                <span style={{ fontSize: '0.8rem', fontWeight: '600' }}>Перетащите фото сюда или нажмите</span>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Поддерживаются PNG, JPG, GIF (макс. 2МБ)</span>
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={handleFileChange} 
                                />
                            </div>
                        </div>

                        <div className="divider" style={{ margin: '1.5rem 0' }}><span>ИЛИ</span></div>

                        <div className="form-group">
                            <label>Вставить ссылку или Ключ Dicebear</label>
                            <input 
                                type="text" 
                                className="input-glow" 
                                placeholder="https://i.imgur.com/xxxxx.png или seed_слово"
                                value={customAvatarUrl.startsWith('data:image') ? '[Локальное изображение с ПК]' : customAvatarUrl}
                                onChange={(e) => setCustomAvatarUrl(e.target.value)}
                            />
                            <small className="help-text">
                                Вставьте ссылку на картинку или seed-слово для генерации пиксельного персонажа!
                            </small>
                        </div>
                        
                        <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1.5rem' }} disabled={loading}>
                            {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : 'Сохранить Аватарку'}
                        </button>
                    </form>
                </div>
            </div>

            {/* Custom Action Confirmation Modal */}
            <div className={`modal-overlay ${customConfirm.show ? 'active' : ''}`}>
                <div className="modal-content glass-panel glow-purple" style={{ border: '1px solid var(--primary)', maxWidth: '480px', padding: '2.5rem' }}>
                    <div className="modal-header" style={{ marginBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
                        <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.25rem' }}>
                            <i className="fa-solid fa-triangle-exclamation" style={{ color: 'var(--primary)', textShadow: '0 0 10px var(--primary)' }}></i>
                            {customConfirm.title}
                        </h3>
                    </div>
                    <div style={{ marginTop: '0.5rem', marginBottom: '2.2rem' }}>
                        <p style={{ color: '#ffffff', fontSize: '0.9rem', lineHeight: '1.6', textAlign: 'left' }}>
                            {customConfirm.message}
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '14px' }}>
                        <button 
                            type="button" 
                            className="btn-primary" 
                            style={{ flex: '1', background: 'linear-gradient(135deg, var(--primary) 0%, #a88133 100%)', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.82rem', padding: '10px' }} 
                            onClick={customConfirm.onConfirm}
                        >
                            {customConfirm.confirmText}
                        </button>
                        <button 
                            type="button" 
                            className="btn-secondary" 
                            style={{ flex: '1', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.82rem', padding: '10px' }} 
                            onClick={() => setCustomConfirm(prev => ({ ...prev, show: false }))}
                        >
                            {customConfirm.cancelText}
                        </button>
                    </div>
                </div>
            </div>

            {/* Toast Notifications Overlay Container */}
            <div className="toast-container">
                {toasts.map(toast => (
                    <div key={toast.id} className={`toast-item ${toast.type}`}>
                        <i className={`fa-solid ${toast.type === 'success' ? 'fa-circle-check' : toast.type === 'error' ? 'fa-circle-xmark' : 'fa-circle-info'}`}></i>
                        <span>{toast.msg}</span>
                    </div>
                ))}
            </div>

        </div>
    );
}
