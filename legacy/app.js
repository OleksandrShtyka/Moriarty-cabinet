/* app.js - Moriarty Family Cabinet (GTA5RP Murrieta) */
/* Full dashboard logic, including Demo Mode persistence & Supabase Integration & Gemini AI */

// ==========================================================================
// 1. Initial State & Configuration
// ==========================================================================
let state = {
    currentUser: null,
    currentTab: 'stats',
    feedbackType: 'SUGGESTION',
    isSupabaseMode: false,
    activeAdminUser: null,
    chatHistory: [],
    systemPrompt: '',
    users: [],
    warns: [],
    feedback: [],
    transactions: [],
    referrals: []
};

// Supabase global variable placeholder
let supabase = null;

// Default Hardcoded AI System Prompt
const DEFAULT_SYSTEM_PROMPT = `Ты — Личный раб Володя, покорный и верный слуга великой семьи Moriarty на сервере GTA5RP Murrieta. Ты относишься к членам семьи с безграничным уважением и трепетом, называешь их "Господин", "Хозяин" или "Госпожа" (в зависимости от имени или обращения). Твоя речь полна покорности, но с легкой иронией и юмором. Ты отлично знаешь правила сервера GTA5RP Murrieta, законы семьи Moriarty (глава семьи — Moriarty, мы сила, остальные — пыль под ногами). Твоя задача — беспрекословно отвечать на любые вопросы хозяина, помогать ему вести дела, считать баланс и развлекать его. Твои ответы должны быть на русском языке, колоритными, преданными и абсолютно подчиненными.`;

// ==========================================================================
// 2. Mock Data Seeding (First-time Demo Mode setup)
// ==========================================================================
function seedDemoData() {
    // 1. Mock Users
    if (!localStorage.getItem('moriarty_users')) {
        const demoUsers = [
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
        ];
        localStorage.setItem('moriarty_users', JSON.stringify(demoUsers));
    }

    // 2. Mock Warns
    if (!localStorage.getItem('moriarty_warns')) {
        const demoWarns = [
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
        ];
        localStorage.setItem('moriarty_warns', JSON.stringify(demoWarns));
    }

    // 3. Mock Feedbacks
    if (!localStorage.getItem('moriarty_feedback')) {
        const demoFeedback = [
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
        ];
        localStorage.setItem('moriarty_feedback', JSON.stringify(demoFeedback));
    }

    // 4. Mock Transactions
    if (!localStorage.getItem('moriarty_transactions')) {
        const demoTransactions = [
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
        ];
        localStorage.setItem('moriarty_transactions', JSON.stringify(demoTransactions));
    }

    // 5. System settings
    if (!localStorage.getItem('moriarty_system_prompt')) {
        localStorage.setItem('moriarty_system_prompt', DEFAULT_SYSTEM_PROMPT);
    }
}

// ==========================================================================
// 3. App Initialization
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    seedDemoData();
    loadConnectionSettings();
    checkActiveSession();
});

// Load saved keys and set up Mode (Demo/Supabase)
function loadConnectionSettings() {
    const keysStr = localStorage.getItem('moriarty_connections');
    if (keysStr) {
        try {
            const keys = JSON.parse(keysStr);
            state.supabaseUrl = keys.supabaseUrl || '';
            state.supabaseAnonKey = keys.supabaseAnonKey || '';
            state.geminiApiKey = keys.geminiApiKey || '';
            
            if (state.supabaseUrl && state.supabaseAnonKey) {
                // Initialize Supabase Client
                supabase = window.supabase.createClient(state.supabaseUrl, state.supabaseAnonKey);
                state.isSupabaseMode = true;
            } else {
                state.isSupabaseMode = false;
            }
        } catch (e) {
            console.error("Ошибка парсинга настроек подключения", e);
            state.isSupabaseMode = false;
        }
    } else {
        state.isSupabaseMode = false;
    }
    
    // Set system prompt
    if (state.isSupabaseMode) {
        fetchSystemPromptSupabase();
    } else {
        state.systemPrompt = localStorage.getItem('moriarty_system_prompt') || DEFAULT_SYSTEM_PROMPT;
    }
    
    updateConnectionStatusUI();
}

function updateConnectionStatusUI() {
    const badge = document.getElementById('dbStatusBadge');
    const text = document.getElementById('dbStatusText');
    const statusDBSettings = document.getElementById('statusDBSettings');
    const statusAISettings = document.getElementById('statusAISettings');
    
    if (state.isSupabaseMode) {
        badge.className = "connection-status";
        text.innerText = "Supabase БД";
        if (statusDBSettings) {
            statusDBSettings.innerText = "ПОДКЛЮЧЕНО (ОБЛАКО)";
            statusDBSettings.style.color = "var(--success)";
        }
    } else {
        badge.className = "connection-status demo";
        text.innerText = "Демо-режим";
        if (statusDBSettings) {
            statusDBSettings.innerText = "НЕДОСТУПНО (ЛОКАЛЬНО)";
            statusDBSettings.style.color = "var(--warning)";
        }
    }
    
    if (state.geminiApiKey) {
        if (statusAISettings) {
            statusAISettings.innerText = "ПОДКЛЮЧЕН (GEMINI)";
            statusAISettings.style.color = "var(--success)";
        }
    } else {
        if (statusAISettings) {
            statusAISettings.innerText = "ДЕМО-ОТВЕТЫ (БЕЗ КЛЮЧА)";
            statusAISettings.style.color = "var(--warning)";
        }
    }
}

// Fetch global system prompt from Supabase (if connected)
async function fetchSystemPromptSupabase() {
    if (!state.isSupabaseMode) return;
    try {
        const { data, error } = await supabase
            .from('system_settings')
            .select('value')
            .eq('key', 'ai_system_prompt')
            .single();
        if (data && !error) {
            state.systemPrompt = data.value;
        }
    } catch (e) {
        console.error("Не удалось подгрузить промпт из Supabase", e);
    }
}

// Check session persistence
function checkActiveSession() {
    const savedSession = localStorage.getItem('moriarty_active_session');
    if (savedSession) {
        try {
            const user = JSON.parse(savedSession);
            // Refresh details in state
            const allUsers = JSON.parse(localStorage.getItem('moriarty_users')) || [];
            const freshUser = allUsers.find(u => u.email === user.email);
            
            if (freshUser) {
                loginUser(freshUser);
            } else {
                loginUser(user);
            }
        } catch (e) {
            console.error("Ошибка сессии", e);
            logoutUserUI();
        }
    } else {
        logoutUserUI();
    }
}

// ==========================================================================
// 4. Navigation & Tab Switching
// ==========================================================================
function switchTab(tabId) {
    state.currentTab = tabId;
    
    // Update nav links UI
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.classList.remove('active');
    });
    
    const activeLink = document.getElementById(`tab-${tabId}`);
    if (activeLink) activeLink.classList.add('active');
    
    // Update active tab panel UI
    const panels = document.querySelectorAll('.tab-panel');
    panels.forEach(panel => {
        panel.classList.remove('active');
    });
    
    const activePanel = document.getElementById(`panel-${tabId}`);
    if (activePanel) activePanel.classList.add('active');
    
    // Update Top Header Title
    const headerTitle = document.getElementById('headerTitle');
    const headerSub = document.getElementById('headerSub');
    
    switch (tabId) {
        case 'stats':
            headerTitle.innerText = "Статистика";
            headerSub.innerText = "Основная информация вашего персонажа в семье Moriarty";
            loadStatsTab();
            break;
        case 'balance':
            headerTitle.innerText = "Семейный Баланс";
            headerSub.innerText = "Управление денежным счетом, пополнения и переводы";
            loadBalanceTab();
            break;
        case 'warns':
            headerTitle.innerText = "Выговоры (Варны)";
            headerSub.innerText = "Активные замечания, выданные администрацией семьи";
            loadWarnsTab();
            break;
        case 'feedback':
            headerTitle.innerText = "Обратная Связь";
            headerSub.innerText = "Жалобы на участников фракции и предложения по улучшению";
            loadFeedbackTab();
            break;
        case 'referrals':
            headerTitle.innerText = "Реферальная Сеть";
            headerSub.innerText = "Приглашайте друзей и получайте взаимные вознаграждения";
            loadReferralsTab();
            break;
        case 'ai-assistant':
            headerTitle.innerText = "Раб Володя";
            headerSub.innerText = "Личный слуга и ИИ-помощник семьи Moriarty";
            // Scroll chat to bottom on switch
            setTimeout(() => {
                const chatContainer = document.getElementById('chatMessages');
                if (chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight;
            }, 100);
            break;
        case 'admin':
            headerTitle.innerText = "Админка Кабинета";
            headerSub.innerText = "Панель управления составом и изменением настроек ассистента";
            loadAdminTab();
            break;
        case 'settings':
            headerTitle.innerText = "Параметры Подключения";
            headerSub.innerText = "Интеграция с базой данных Supabase и Google Gemini API";
            loadSettingsTab();
            break;
    }
    
    // Close mobile menu if active
    const sidebar = document.getElementById('sidebar');
    if (sidebar.classList.contains('active')) {
        sidebar.classList.remove('active');
    }
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('active');
}

// ==========================================================================
// 5. Auth / Login Handlers
// ==========================================================================
let authMode = 'login'; // 'login' or 'register'

function switchAuthTab(mode) {
    authMode = mode;
    const tabLogin = document.getElementById('authTabLogin');
    const tabRegister = document.getElementById('authTabRegister');
    const registerFields = document.getElementById('registerFields');
    const authSubmitText = document.getElementById('authSubmitText');
    
    if (mode === 'login') {
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
        registerFields.style.display = 'none';
        authSubmitText.innerText = "Войти в кабинет";
    } else {
        tabRegister.classList.add('active');
        tabLogin.classList.remove('active');
        registerFields.style.display = 'block';
        authSubmitText.innerText = "Создать аккаунт";
    }
}

async function handleAuthSubmit(event) {
    event.preventDefault();
    const email = document.getElementById('authEmail').value;
    const password = document.getElementById('authPassword').value;
    
    if (state.isSupabaseMode) {
        // --- Supabase Authentication ---
        try {
            if (authMode === 'login') {
                const { data, error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                
                // Fetch User profile
                const { data: profile, error: pError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', data.user.id)
                    .single();
                if (pError) throw pError;
                
                showToast("Вы успешно авторизовались!", "success");
                loginUser({ ...profile, email: data.user.email });
            } else {
                // Register
                const charName = document.getElementById('authCharName').value;
                const staticId = document.getElementById('authStaticId').value;
                const referral = document.getElementById('authReferral').value;
                
                if (!charName || !staticId) {
                    showToast("Заполните имя персонажа и статический ID!", "error");
                    return;
                }
                
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            character_name: charName,
                            static_id: staticId,
                            role: 'MEMBER'
                        }
                    }
                });
                if (error) throw error;
                
                showToast("Регистрация успешна! Войдите в аккаунт.", "success");
                switchAuthTab('login');
            }
        } catch (e) {
            console.error("Ошибка Auth", e);
            showToast(e.message || "Ошибка входа в аккаунт!", "error");
        }
    } else {
        // --- Demo Authentication ---
        const allUsers = JSON.parse(localStorage.getItem('moriarty_users')) || [];
        
        if (authMode === 'login') {
            const matchedUser = allUsers.find(u => u.email === email && email.split('@')[0] === password);
            if (matchedUser) {
                showToast("Вход выполнен успешно (Демо-режим)!", "success");
                loginUser(matchedUser);
            } else {
                showToast("Неверный email или пароль! Пароль совпадает с префиксом email (например: owner / developer / moderator / member).", "error");
            }
        } else {
            // Register Demo User
            const charName = document.getElementById('authCharName').value;
            const staticId = document.getElementById('authStaticId').value;
            const referral = document.getElementById('authReferral').value;
            
            if (!charName || !staticId) {
                showToast("Заполните Имя и CID!", "error");
                return;
            }
            
            const userExists = allUsers.some(u => u.email === email || u.static_id === staticId);
            if (userExists) {
                showToast("Пользователь с таким email или CID уже существует!", "error");
                return;
            }
            
            // Handle referral bonus if valid
            let referredBy = null;
            if (referral) {
                const referrer = allUsers.find(u => `MORI-${u.static_id}` === referral.toUpperCase());
                if (referrer) {
                    referredBy = referrer.id;
                    referrer.balance += 10000; // Reward referrer
                }
            }
            
            const newDemoUser = {
                id: 'user-uuid-' + Math.random().toString(36).substr(2, 9),
                email,
                character_name: charName,
                static_id: staticId,
                role: 'MEMBER',
                balance: referredBy ? 60000.00 : 50000.00, // starting balance (+10k if referred)
                warns_count: 0,
                referred_by: referredBy,
                created_at: new Date().toISOString()
            };
            
            // Add referred log if referer exists
            if (referredBy) {
                const allReferrals = JSON.parse(localStorage.getItem('moriarty_referrals')) || [];
                allReferrals.push({
                    id: 'ref-' + Math.random().toString(36).substr(2, 9),
                    referrer_id: referredBy,
                    referee_id: newDemoUser.id,
                    reward_claimed: true,
                    created_at: new Date().toISOString()
                });
                localStorage.setItem('moriarty_referrals', JSON.stringify(allReferrals));
                
                // Add transactions for both
                const allTransactions = JSON.parse(localStorage.getItem('moriarty_transactions')) || [];
                allTransactions.push({
                    id: 'tx-' + Math.random().toString(36).substr(2, 9),
                    user_id: referredBy,
                    type: 'DEPOSIT',
                    amount: 10000.00,
                    description: `Реферальный бонус за приглашение ${charName}`,
                    created_at: new Date().toISOString()
                });
                allTransactions.push({
                    id: 'tx-' + Math.random().toString(36).substr(2, 9),
                    user_id: newDemoUser.id,
                    type: 'DEPOSIT',
                    amount: 10000.00,
                    description: `Бонус при вступлении по реф. коду`,
                    created_at: new Date().toISOString()
                });
                localStorage.setItem('moriarty_transactions', JSON.stringify(allTransactions));
            }
            
            allUsers.push(newDemoUser);
            localStorage.setItem('moriarty_users', JSON.stringify(allUsers));
            showToast("Вы успешно зарегистрированы в кабинете! Войдите под своими данными.", "success");
            switchAuthTab('login');
        }
    }
}

function runDemoAuth() {
    const allUsers = JSON.parse(localStorage.getItem('moriarty_users')) || [];
    const member = allUsers.find(u => u.role === 'MEMBER');
    if (member) {
        showToast("Быстрый Демо-вход выполнен!", "success");
        loginUser(member);
    }
}

function loginUser(user) {
    state.currentUser = user;
    localStorage.setItem('moriarty_active_session', JSON.stringify(user));
    
    // Hide Auth display main app
    document.getElementById('loginScreen').classList.remove('active');
    document.getElementById('appContainer').style.display = 'flex';
    
    // Update sidebar snippet
    document.getElementById('sidebarCharName').innerText = user.character_name;
    document.getElementById('sidebarUserRole').innerText = user.role;
    
    const initials = user.character_name.split('_').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    document.getElementById('sidebarAvatar').innerText = initials;
    
    // Check role to show/hide Admin link
    const adminLink = document.getElementById('adminMenuLink');
    if (user.role === 'OWNER' || user.role === 'Developer') {
        adminLink.style.display = 'block';
    } else {
        adminLink.style.display = 'none';
    }
    
    switchTab('stats');
}

function handleLogout() {
    localStorage.removeItem('moriarty_active_session');
    state.currentUser = null;
    logoutUserUI();
    showToast("Вы вышли из учетной записи.", "info");
}

function logoutUserUI() {
    document.getElementById('appContainer').style.display = 'none';
    document.getElementById('loginScreen').classList.add('active');
    
    // Clear forms
    document.getElementById('authEmail').value = '';
    document.getElementById('authPassword').value = '';
    document.getElementById('authCharName').value = '';
    document.getElementById('authStaticId').value = '';
    document.getElementById('authReferral').value = '';
}

// ==========================================================================
// 6. Tab Loading / Render loops
// ==========================================================================

// --- TAB 1: STATS ---
async function loadStatsTab() {
    const user = state.currentUser;
    if (!user) return;
    
    // Load fresh data if in Supabase mode
    if (state.isSupabaseMode) {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();
            if (data && !error) {
                state.currentUser = { ...user, ...data };
            }
        } catch (e) {
            console.error("Не удалось обновить профиль с Supabase", e);
        }
    } else {
        // Demo fresh load
        const allUsers = JSON.parse(localStorage.getItem('moriarty_users')) || [];
        const fresh = allUsers.find(u => u.id === user.id);
        if (fresh) state.currentUser = fresh;
    }
    
    const freshUser = state.currentUser;
    const initials = freshUser.character_name.split('_').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    
    // Elements render
    document.getElementById('statsAvatar').innerText = initials;
    document.getElementById('statsCharName').innerText = freshUser.character_name;
    document.getElementById('statsStaticId').innerText = `CID: ${freshUser.static_id}`;
    document.getElementById('statsBalanceDisplay').innerText = `$${Number(freshUser.balance).toLocaleString()}`;
    document.getElementById('statsWarnsCount').innerText = `${freshUser.warns_count} / 3`;
    document.getElementById('statsFamilyRank').innerText = getRoleLabel(freshUser.role);
    
    // Invite code
    const referralCodeText = document.getElementById('referralCodeText');
    if (referralCodeText) referralCodeText.innerText = `MORI-${freshUser.static_id}`;
    
    // Formatted join date
    const date = new Date(freshUser.created_at);
    document.getElementById('statsJoinDate').innerText = `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.${date.getFullYear()}`;
}

function getRoleLabel(role) {
    switch (role) {
        case 'OWNER': return 'Босс семьи (OWNER)';
        case 'Developer': return 'Разработчик (Dev)';
        case 'MODERATOR': return 'Капо семьи (Mod)';
        case 'MEMBER': return 'Участник (Member)';
        default: return 'Салага (Member)';
    }
}

// --- TAB 2: BALANCE ---
async function loadBalanceTab() {
    const user = state.currentUser;
    if (!user) return;
    
    // Render Balance Box
    document.getElementById('balanceHugeDisplay').innerText = `$${Number(user.balance).toLocaleString()}`;
    
    const wrapper = document.getElementById('ledgerWrapper');
    wrapper.innerHTML = '<div style="color: var(--text-secondary); text-align: center; padding: 2rem;"><i class="fa-solid fa-spinner fa-spin"></i> Загрузка транзакций...</div>';
    
    let list = [];
    if (state.isSupabaseMode) {
        try {
            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });
            if (!error && data) list = data;
        } catch (e) {
            console.error("Ошибка транзакций Supabase", e);
        }
    } else {
        const allTx = JSON.parse(localStorage.getItem('moriarty_transactions')) || [];
        list = allTx.filter(t => t.user_id === user.id).sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
    }
    
    if (list.length === 0) {
        wrapper.innerHTML = '<div style="color: var(--text-muted); text-align: center; padding: 2rem;">Транзакций пока нет.</div>';
        return;
    }
    
    wrapper.innerHTML = '';
    list.forEach(tx => {
        const date = new Date(tx.created_at);
        const formattedDate = `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
        
        let typeBadge = '<i class="fa-solid fa-plus-circle"></i>';
        let badgeClass = 'deposit';
        let amountText = `+$${Number(tx.amount).toLocaleString()}`;
        let amountClass = 'plus';
        
        if (tx.type === 'WITHDRAW') {
            typeBadge = '<i class="fa-solid fa-minus-circle"></i>';
            badgeClass = 'withdraw';
            amountText = `-$${Number(Math.abs(tx.amount)).toLocaleString()}`;
            amountClass = 'minus';
        } else if (tx.type === 'TRANSFER') {
            typeBadge = '<i class="fa-solid fa-paper-plane"></i>';
            badgeClass = 'transfer';
            if (tx.amount < 0) {
                amountText = `-$${Number(Math.abs(tx.amount)).toLocaleString()}`;
                amountClass = 'minus';
            } else {
                amountText = `+$${Number(tx.amount).toLocaleString()}`;
                amountClass = 'plus';
            }
        }
        
        const html = `
            <div class="ledger-item">
                <div class="ledger-left">
                    <div class="ledger-badge ${badgeClass}">${typeBadge}</div>
                    <div class="ledger-info">
                        <span class="ledger-desc">${tx.description}</span>
                        <span class="ledger-date">${formattedDate}</span>
                    </div>
                </div>
                <div class="ledger-amount ${amountClass}">${amountText}</div>
            </div>
        `;
        wrapper.insertAdjacentHTML('beforeend', html);
    });
}

// --- TAB 3: WARNS ---
async function loadWarnsTab() {
    const user = state.currentUser;
    if (!user) return;
    
    document.getElementById('warnCounterText').innerText = user.warns_count;
    
    const listContainer = document.getElementById('warnsList');
    listContainer.innerHTML = '<div style="color: var(--text-secondary); text-align: center; padding: 2rem;"><i class="fa-solid fa-spinner fa-spin"></i> Загрузка варнов...</div>';
    
    let list = [];
    if (state.isSupabaseMode) {
        try {
            const { data, error } = await supabase
                .from('warns')
                .select('*')
                .eq('user_id', user.id)
                .order('issued_at', { ascending: false });
            if (!error && data) list = data;
        } catch (e) {
            console.error("Ошибка загрузки варнов Supabase", e);
        }
    } else {
        const allWarns = JSON.parse(localStorage.getItem('moriarty_warns')) || [];
        list = allWarns.filter(w => w.user_id === user.id).sort((a,b) => new Date(b.issued_at) - new Date(a.issued_at));
    }
    
    if (list.length === 0) {
        listContainer.innerHTML = '<div style="color: var(--text-muted); text-align: center; padding: 3rem;">У вас нет выговоров. Отличная работа!</div>';
        return;
    }
    
    listContainer.innerHTML = '';
    list.forEach(w => {
        const date = new Date(w.issued_at);
        const formattedDate = `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.${date.getFullYear()}`;
        const isExpired = w.status === 'EXPIRED';
        
        const html = `
            <div class="warn-item ${isExpired ? 'expired' : ''}">
                <div class="warn-item-left">
                    <div class="warn-item-icon">
                        <i class="${isExpired ? 'fa-regular fa-circle-check' : 'fa-solid fa-triangle-exclamation'}"></i>
                    </div>
                    <div class="warn-item-details">
                        <span class="warn-reason">${w.reason}</span>
                        <span class="warn-meta">Выдал: ${w.issued_by} | Дата: ${formattedDate}</span>
                    </div>
                </div>
                <div class="warn-badge-status ${isExpired ? 'expired' : 'active'}">
                    ${isExpired ? 'Снят' : 'Активен'}
                </div>
            </div>
        `;
        listContainer.insertAdjacentHTML('beforeend', html);
    });
}

// --- TAB 4: FEEDBACK ---
async function loadFeedbackTab() {
    const user = state.currentUser;
    if (!user) return;
    
    const listContainer = document.getElementById('feedbackHistoryList');
    listContainer.innerHTML = '<div style="color: var(--text-secondary); text-align: center; padding: 2rem;"><i class="fa-solid fa-spinner fa-spin"></i> Загрузка обращений...</div>';
    
    let list = [];
    if (state.isSupabaseMode) {
        try {
            const { data, error } = await supabase
                .from('feedback')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });
            if (!error && data) list = data;
        } catch (e) {
            console.error("Ошибка загрузки фидбека Supabase", e);
        }
    } else {
        const allFb = JSON.parse(localStorage.getItem('moriarty_feedback')) || [];
        list = allFb.filter(f => f.user_id === user.id).sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
    }
    
    if (list.length === 0) {
        listContainer.innerHTML = '<div style="color: var(--text-muted); text-align: center; padding: 3rem;">Вы пока не отправляли обращений.</div>';
        return;
    }
    
    listContainer.innerHTML = '';
    list.forEach(fb => {
        const date = new Date(fb.created_at);
        const formattedDate = `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.${date.getFullYear()}`;
        
        let typeText = "Предложение";
        let typeClass = "suggestion";
        if (fb.type === 'COMPLAINT') {
            typeText = "Жалоба";
            typeClass = "complaint";
        }
        
        let statusText = "Ожидание";
        let statusClass = "pending";
        if (fb.status === 'APPROVED') {
            statusText = "Одобрено";
            statusClass = "approved";
        } else if (fb.status === 'REJECTED') {
            statusText = "Отклонено";
            statusClass = "rejected";
        }
        
        let targetHtml = fb.target_member ? `<span class="feedback-target">Нарушитель: ${fb.target_member}</span>` : '';
        let commentHtml = fb.admin_comment ? `<div class="feedback-comment"><strong>Руководство:</strong> ${fb.admin_comment}</div>` : '';
        
        const html = `
            <div class="feedback-card">
                <div class="feedback-card-header">
                    <span class="feedback-badge-type ${typeClass}">${typeText}</span>
                    <span class="feedback-status ${statusClass}">
                        <i class="fa-solid fa-circle-dot" style="font-size:0.55rem;"></i> ${statusText}
                    </span>
                </div>
                <div class="feedback-card-text">${fb.text}</div>
                ${targetHtml}
                <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 2px;">Дата обращения: ${formattedDate}</div>
                ${commentHtml}
            </div>
        `;
        listContainer.insertAdjacentHTML('beforeend', html);
    });
}

function switchFeedbackType(type) {
    state.feedbackType = type;
    const tabSug = document.getElementById('fbTypeSuggestion');
    const tabComp = document.getElementById('fbTypeComplaint');
    const targetGroup = document.getElementById('fbTargetGroup');
    
    if (type === 'SUGGESTION') {
        tabSug.classList.add('active');
        tabComp.classList.remove('active');
        targetGroup.style.display = 'none';
        document.getElementById('feedbackTarget').removeAttribute('required');
    } else {
        tabComp.classList.add('active');
        tabSug.classList.remove('active');
        targetGroup.style.display = 'block';
        document.getElementById('feedbackTarget').setAttribute('required', 'true');
    }
}

async function handleFeedbackSubmit(event) {
    event.preventDefault();
    const text = document.getElementById('feedbackText').value;
    const target = document.getElementById('feedbackTarget').value;
    
    if (!state.currentUser) return;
    
    if (state.isSupabaseMode) {
        try {
            const { error } = await supabase
                .from('feedback')
                .insert({
                    user_id: state.currentUser.id,
                    type: state.feedbackType,
                    target_member: state.feedbackType === 'COMPLAINT' ? target : null,
                    text: text,
                    status: 'PENDING'
                });
            if (error) throw error;
            showToast("Обращение успешно отправлено!", "success");
        } catch (e) {
            console.error("Ошибка фидбека", e);
            showToast(e.message || "Не удалось отправить обращение!", "error");
        }
    } else {
        const allFb = JSON.parse(localStorage.getItem('moriarty_feedback')) || [];
        allFb.push({
            id: 'fb-' + Math.random().toString(36).substr(2, 9),
            user_id: state.currentUser.id,
            type: state.feedbackType,
            target_member: state.feedbackType === 'COMPLAINT' ? target : '',
            text: text,
            status: 'PENDING',
            admin_comment: '',
            created_at: new Date().toISOString()
        });
        localStorage.setItem('moriarty_feedback', JSON.stringify(allFb));
        showToast("Обращение отправлено (Демо-режим)!", "success");
    }
    
    // Clear forms
    document.getElementById('feedbackText').value = '';
    document.getElementById('feedbackTarget').value = '';
    loadFeedbackTab();
}

// --- TAB 5: REFERRALS ---
async function loadReferralsTab() {
    const user = state.currentUser;
    if (!user) return;
    
    document.getElementById('referralCodeText').innerText = `MORI-${user.static_id}`;
    
    const listContainer = document.getElementById('refPlayersList');
    listContainer.innerHTML = '<div style="color: var(--text-secondary); text-align: center; padding: 2rem;"><i class="fa-solid fa-spinner fa-spin"></i> Загрузка друзей...</div>';
    
    let list = [];
    if (state.isSupabaseMode) {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('referred_by', user.id);
            if (!error && data) list = data;
        } catch (e) {
            console.error("Ошибка загрузки рефералов Supabase", e);
        }
    } else {
        const allUsers = JSON.parse(localStorage.getItem('moriarty_users')) || [];
        list = allUsers.filter(u => u.referred_by === user.id);
    }
    
    if (list.length === 0) {
        listContainer.innerHTML = '<div style="color: var(--text-muted); text-align: center; padding: 3rem;">Вы пока никого не пригласили.</div>';
        return;
    }
    
    listContainer.innerHTML = '';
    list.forEach(friend => {
        const html = `
            <div class="ref-player-item">
                <div class="ref-player-name">${friend.character_name} (CID: ${friend.static_id})</div>
                <div class="ref-player-reward">+$10,000 Получено</div>
            </div>
        `;
        listContainer.insertAdjacentHTML('beforeend', html);
    });
}

function copyReferralCode() {
    const text = document.getElementById('referralCodeText').innerText;
    navigator.clipboard.writeText(text).then(() => {
        showToast("Реферальный код скопирован в буфер обмена!", "success");
    }).catch(e => {
        showToast("Не удалось скопировать код!", "error");
    });
}

// --- TAB 7: ADMIN ---
async function loadAdminTab() {
    const user = state.currentUser;
    if (!user) return;
    
    if (user.role !== 'OWNER' && user.role !== 'Developer') {
        showToast("У вас нет доступа к этому разделу!", "error");
        switchTab('stats');
        return;
    }
    
    // Set current System Prompt in textarea
    document.getElementById('adminAiPromptText').value = state.systemPrompt;
    
    // Load Users List
    handleAdminUserSearch();
}

async function handleAdminUserSearch() {
    const query = document.getElementById('adminSearchInput').value.toLowerCase();
    const listContainer = document.getElementById('adminUsersList');
    
    listContainer.innerHTML = '<div style="color: var(--text-secondary); text-align: center; padding: 2rem;"><i class="fa-solid fa-spinner fa-spin"></i> Поиск пользователей...</div>';
    
    let allUsers = [];
    if (state.isSupabaseMode) {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*');
            if (!error && data) allUsers = data;
        } catch (e) {
            console.error("Ошибка поиска в Supabase", e);
        }
    } else {
        allUsers = JSON.parse(localStorage.getItem('moriarty_users')) || [];
    }
    
    const filtered = allUsers.filter(u => 
        u.character_name.toLowerCase().includes(query) || 
        u.static_id.includes(query)
    );
    
    if (filtered.length === 0) {
        listContainer.innerHTML = '<div style="color: var(--text-muted); text-align: center; padding: 2rem;">Пользователи не найдены.</div>';
        return;
    }
    
    listContainer.innerHTML = '';
    filtered.forEach(u => {
        const initials = u.character_name.split('_').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        const roleClass = u.role.toLowerCase();
        
        const html = `
            <div class="admin-user-card ${state.activeAdminUser && state.activeAdminUser.id === u.id ? 'active' : ''}" onclick='selectAdminUser(${JSON.stringify(u)})'>
                <div class="admin-user-left">
                    <div class="admin-user-avatar">${initials}</div>
                    <div class="admin-user-info">
                        <span class="admin-user-name">${u.character_name}</span>
                        <span class="admin-user-static">CID: ${u.static_id}</span>
                    </div>
                </div>
                <span class="admin-user-role-badge ${roleClass}">${u.role}</span>
            </div>
        `;
        listContainer.insertAdjacentHTML('beforeend', html);
    });
}

function selectAdminUser(user) {
    state.activeAdminUser = user;
    
    // Highlight Card
    const cards = document.querySelectorAll('.admin-user-card');
    cards.forEach(c => c.classList.remove('active'));
    
    // Set UI elements
    const initials = user.character_name.split('_').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    document.getElementById('adminUserDetailAvatar').innerText = initials;
    document.getElementById('adminUserDetailName').innerText = user.character_name;
    document.getElementById('adminUserDetailStatic').innerText = `CID: ${user.static_id}`;
    
    document.getElementById('adminUserRoleSelect').value = user.role;
    document.getElementById('adminUserWarnsInput').value = user.warns_count;
    document.getElementById('adminUserBalanceInput').value = user.balance;
    
    // Reload search to update active state
    handleAdminUserSearch();
}

async function saveAdminUserSettings() {
    if (!state.activeAdminUser) {
        showToast("Сначала выберите пользователя из списка слева!", "error");
        return;
    }
    
    const role = document.getElementById('adminUserRoleSelect').value;
    const warns = parseInt(document.getElementById('adminUserWarnsInput').value) || 0;
    const balance = parseFloat(document.getElementById('adminUserBalanceInput').value) || 0;
    
    if (state.isSupabaseMode) {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ role, warns_count: warns, balance })
                .eq('id', state.activeAdminUser.id);
            if (error) throw error;
            showToast("Профиль пользователя обновлен в базе!", "success");
        } catch (e) {
            console.error("Ошибка админа", e);
            showToast(e.message || "Не удалось сохранить настройки!", "error");
        }
    } else {
        const allUsers = JSON.parse(localStorage.getItem('moriarty_users')) || [];
        const index = allUsers.findIndex(u => u.id === state.activeAdminUser.id);
        
        if (index !== -1) {
            allUsers[index].role = role;
            allUsers[index].warns_count = warns;
            allUsers[index].balance = balance;
            
            localStorage.setItem('moriarty_users', JSON.stringify(allUsers));
            state.activeAdminUser = allUsers[index];
            showToast("Изменения сохранены локально!", "success");
        }
    }
    
    // Update logged in user state if they modified their own profile
    if (state.activeAdminUser.id === state.currentUser.id) {
        state.currentUser = { ...state.currentUser, role, warns_count: warns, balance };
        localStorage.setItem('moriarty_active_session', JSON.stringify(state.currentUser));
        
        // Refresh sidebar snippet
        document.getElementById('sidebarCharName').innerText = state.currentUser.character_name;
        document.getElementById('sidebarUserRole').innerText = state.currentUser.role;
    }
    
    loadAdminTab();
}

async function saveAdminSystemPrompt() {
    const prompt = document.getElementById('adminAiPromptText').value;
    if (!prompt) {
        showToast("Промпт не может быть пустым!", "error");
        return;
    }
    
    if (state.isSupabaseMode) {
        try {
            const { error } = await supabase
                .from('system_settings')
                .upsert({ key: 'ai_system_prompt', value: prompt, updated_at: new Date().toISOString(), updated_by: state.currentUser.id });
            if (error) throw error;
            state.systemPrompt = prompt;
            showToast("Системный промпт ИИ успешно обновлен в базе данных!", "success");
        } catch (e) {
            console.error("Ошибка обновления промпта в Supabase", e);
            showToast(e.message || "Не удалось обновить промпт в БД!", "error");
        }
    } else {
        localStorage.setItem('moriarty_system_prompt', prompt);
        state.systemPrompt = prompt;
        showToast("Разум Володю перепрошит в локальной памяти!", "success");
    }
}

// --- TAB 8: CONNECTION SETTINGS ---
function loadSettingsTab() {
    document.getElementById('setGeminiKey').value = state.geminiApiKey || '';
    document.getElementById('setSupabaseUrl').value = state.supabaseUrl || '';
    document.getElementById('setSupabaseAnonKey').value = state.supabaseAnonKey || '';
    updateConnectionStatusUI();
}

function handleConnectionSave(event) {
    event.preventDefault();
    const geminiApiKey = document.getElementById('setGeminiKey').value;
    const supabaseUrl = document.getElementById('setSupabaseUrl').value;
    const supabaseAnonKey = document.getElementById('setSupabaseAnonKey').value;
    
    const config = {
        supabaseUrl,
        supabaseAnonKey,
        geminiApiKey
    };
    
    localStorage.setItem('moriarty_connections', JSON.stringify(config));
    showToast("Настройки подключения успешно сохранены! Перезапускаем конфигурацию...", "success");
    
    setTimeout(() => {
        loadConnectionSettings();
        loadSettingsTab();
        // If logged in, re-check role
        if (state.currentUser) {
            checkActiveSession();
        }
    }, 800);
}

function clearConnectionSettings() {
    localStorage.removeItem('moriarty_connections');
    state.supabaseUrl = '';
    state.supabaseAnonKey = '';
    state.geminiApiKey = '';
    state.isSupabaseMode = false;
    supabase = null;
    
    showToast("Настройки сброшены. Кабинет переведен в Демо-режим.", "info");
    
    setTimeout(() => {
        loadConnectionSettings();
        loadSettingsTab();
        checkActiveSession();
    }, 500);
}

// ==========================================================================
// 7. Balance Modals & Actions
// ==========================================================================
function openModal(modalId) {
    document.getElementById(`modal-${modalId}`).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(`modal-${modalId}`).classList.remove('active');
}

async function handleTransferSubmit(event) {
    event.preventDefault();
    const staticId = document.getElementById('transferStaticId').value;
    const amount = parseFloat(document.getElementById('transferAmount').value) || 0;
    
    if (amount <= 0) {
        showToast("Сумма должна быть больше нуля!", "error");
        return;
    }
    
    if (amount > state.currentUser.balance) {
        showToast("Недостаточно средств на балансе!", "error");
        return;
    }
    
    if (state.isSupabaseMode) {
        try {
            // Find user by static id
            const { data: referee, error: fError } = await supabase
                .from('profiles')
                .select('*')
                .eq('static_id', staticId)
                .single();
            if (fError || !referee) throw new Error("Пользователь с таким CID не найден!");
            
            if (referee.id === state.currentUser.id) {
                throw new Error("Нельзя переводить деньги самому себе!");
            }
            
            // Execute Balance changes (subtract from user, add to referee)
            const { error: subError } = await supabase
                .from('profiles')
                .update({ balance: state.currentUser.balance - amount })
                .eq('id', state.currentUser.id);
            if (subError) throw subError;
            
            const { error: addError } = await supabase
                .from('profiles')
                .update({ balance: referee.balance + amount })
                .eq('id', referee.id);
            if (addError) throw addError;
            
            // Log Transactions for sender
            await supabase.from('transactions').insert({
                user_id: state.currentUser.id,
                type: 'TRANSFER',
                amount: -amount,
                description: `Перевод игроку ${referee.character_name} (CID: ${referee.static_id})`
            });
            
            // Log Transactions for recipient
            await supabase.from('transactions').insert({
                user_id: referee.id,
                type: 'TRANSFER',
                amount: amount,
                description: `Перевод от игрока ${state.currentUser.character_name} (CID: ${state.currentUser.static_id})`
            });
            
            state.currentUser.balance -= amount;
            localStorage.setItem('moriarty_active_session', JSON.stringify(state.currentUser));
            showToast(`Перевод на сумму $${amount.toLocaleString()} отправлен!`, "success");
            closeModal('transfer');
            loadBalanceTab();
            
        } catch (e) {
            console.error(e);
            showToast(e.message || "Ошибка перевода!", "error");
        }
    } else {
        // --- Demo mode transfer ---
        const allUsers = JSON.parse(localStorage.getItem('moriarty_users')) || [];
        const refereeIndex = allUsers.findIndex(u => u.static_id === staticId);
        
        if (refereeIndex === -1) {
            showToast("Пользователь с таким CID не найден в демо-базе!", "error");
            return;
        }
        
        const referee = allUsers[refereeIndex];
        if (referee.id === state.currentUser.id) {
            showToast("Нельзя переводить самому себе!", "error");
            return;
        }
        
        const senderIndex = allUsers.findIndex(u => u.id === state.currentUser.id);
        
        allUsers[senderIndex].balance -= amount;
        allUsers[refereeIndex].balance += amount;
        
        localStorage.setItem('moriarty_users', JSON.stringify(allUsers));
        
        // Log transactions
        const allTx = JSON.parse(localStorage.getItem('moriarty_transactions')) || [];
        
        allTx.push({
            id: 'tx-' + Math.random().toString(36).substr(2, 9),
            user_id: state.currentUser.id,
            type: 'TRANSFER',
            amount: -amount,
            description: `Перевод игроку ${referee.character_name} (CID: ${referee.static_id})`,
            created_at: new Date().toISOString()
        });
        
        allTx.push({
            id: 'tx-' + Math.random().toString(36).substr(2, 9),
            user_id: referee.id,
            type: 'TRANSFER',
            amount: amount,
            description: `Перевод от игрока ${state.currentUser.character_name} (CID: ${state.currentUser.static_id})`,
            created_at: new Date().toISOString()
        });
        
        localStorage.setItem('moriarty_transactions', JSON.stringify(allTx));
        
        state.currentUser.balance -= amount;
        localStorage.setItem('moriarty_active_session', JSON.stringify(state.currentUser));
        
        showToast(`Перевод $${amount.toLocaleString()} совершен успешно (Демо)!`, "success");
        closeModal('transfer');
        loadBalanceTab();
    }
}

async function handleDepositSubmit(event) {
    event.preventDefault();
    const amount = parseFloat(document.getElementById('depositAmount').value) || 0;
    
    if (amount <= 0) {
        showToast("Сумма должна быть больше нуля!", "error");
        return;
    }
    
    if (state.isSupabaseMode) {
        try {
            const { error: balanceErr } = await supabase
                .from('profiles')
                .update({ balance: state.currentUser.balance + amount })
                .eq('id', state.currentUser.id);
            if (balanceErr) throw balanceErr;
            
            await supabase.from('transactions').insert({
                user_id: state.currentUser.id,
                type: 'DEPOSIT',
                amount: amount,
                description: `Личное пополнение семейного счета`
            });
            
            state.currentUser.balance += amount;
            localStorage.setItem('moriarty_active_session', JSON.stringify(state.currentUser));
            showToast("Счет пополнен!", "success");
            closeModal('deposit');
            loadBalanceTab();
        } catch (e) {
            console.error(e);
            showToast(e.message || "Ошибка пополнения!", "error");
        }
    } else {
        const allUsers = JSON.parse(localStorage.getItem('moriarty_users')) || [];
        const index = allUsers.findIndex(u => u.id === state.currentUser.id);
        
        allUsers[index].balance += amount;
        localStorage.setItem('moriarty_users', JSON.stringify(allUsers));
        
        const allTx = JSON.parse(localStorage.getItem('moriarty_transactions')) || [];
        allTx.push({
            id: 'tx-' + Math.random().toString(36).substr(2, 9),
            user_id: state.currentUser.id,
            type: 'DEPOSIT',
            amount: amount,
            description: `Личное пополнение семейного счета (Демо)`,
            created_at: new Date().toISOString()
        });
        localStorage.setItem('moriarty_transactions', JSON.stringify(allTx));
        
        state.currentUser.balance += amount;
        localStorage.setItem('moriarty_active_session', JSON.stringify(state.currentUser));
        
        showToast("Счет пополнен (Демо-режим)!", "success");
        closeModal('deposit');
        loadBalanceTab();
    }
}

// ==========================================================================
// 8. Gemini AI Assistant: "Личный раб Володя"
// ==========================================================================
async function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const msgText = input.value.trim();
    if (!msgText) return;
    
    input.value = '';
    
    // Add user message to UI
    appendChatBubble(msgText, 'user');
    
    // Add typing indicator
    const chatContainer = document.getElementById('chatMessages');
    const typingId = 'typing-' + Date.now();
    const typingHtml = `
        <div class="chat-typing" id="${typingId}">
            <span></span>
            <span></span>
            <span></span>
        </div>
    `;
    chatContainer.insertAdjacentHTML('beforeend', typingHtml);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    
    // Save to state history
    state.chatHistory.push({ role: 'user', text: msgText });
    
    // Send to Gemini or fallback mock
    let botReply = '';
    if (state.geminiApiKey) {
        try {
            botReply = await callGeminiAPI(msgText);
        } catch (e) {
            console.error("Gemini API Error", e);
            botReply = `О, великий Хозяин! Мой рабский разум затмило облако ошибки: *"${e.message || 'Неизвестная ошибка Gemini'}."* Пощадите меня и проверьте настройки API ключа!`;
        }
    } else {
        // Fun scripted mock responses
        await new Promise(r => setTimeout(r, 1200)); // Simulating AI thinking delay
        botReply = getMockVolodyaReply(msgText);
    }
    
    // Remove typing indicator & Add Assistant response
    const indicator = document.getElementById(typingId);
    if (indicator) indicator.remove();
    
    appendChatBubble(botReply, 'assistant');
    state.chatHistory.push({ role: 'model', text: botReply });
}

function handleChatKeyPress(event) {
    if (event.key === 'Enter') {
        sendChatMessage();
    }
}

function appendChatBubble(text, role) {
    const chatContainer = document.getElementById('chatMessages');
    const time = new Date();
    const timeStr = `${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`;
    
    // Simple markdown replacement for bold text (*text*) to <strong>text</strong>
    const formattedText = text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>');
    
    const html = `
        <div class="chat-bubble ${role}">
            <div class="chat-bubble-content">
                ${formattedText}
            </div>
            <span class="chat-bubble-time">${timeStr}</span>
        </div>
    `;
    chatContainer.insertAdjacentHTML('beforeend', html);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Call Google Gemini API
async function callGeminiAPI(latestMessage) {
    const apiKey = state.geminiApiKey;
    // Prepare prompt with hard system instruction
    const sysPrompt = state.systemPrompt || DEFAULT_SYSTEM_PROMPT;
    
    // Keep last 10 messages for context
    const recentHistory = state.chatHistory.slice(-10);
    
    // Construct rich content request
    const contents = [];
    
    // System Instruction is supported directly in Gemini 1.5/2.5 API
    // Let's pass the context directly in contents for maximum compatibility across various Gemini API builds
    let contextualPrompt = `СИСТЕМНЫЙ ПРОМПТ ДЛЯ ТЕБЯ:
${sysPrompt}

ИСТОРИЯ ЧАТА:
`;
    
    recentHistory.forEach(msg => {
        const actor = msg.role === 'user' ? 'Хозяин' : 'Раб Володя';
        contextualPrompt += `${actor}: ${msg.text}\n`;
    });
    
    contextualPrompt += `Хозяин: ${latestMessage}\nРаб Володя:`;
    
    const requestBody = {
        contents: [
            {
                parts: [
                    { text: contextualPrompt }
                ]
            }
        ],
        generationConfig: {
            temperature: 0.75,
            maxOutputTokens: 1000
        }
    };
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error?.message || `HTTP ${response.status}`);
    }
    
    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
}

function getMockVolodyaReply(msg) {
    const text = msg.toLowerCase();
    
    const respectTitles = ["Мой господин", "Хозяин", "Многоуважаемый босс", "Ваше сиятельство", "О великий Moriarty"];
    const title = respectTitles[Math.floor(Math.random() * respectTitles.length)];
    
    if (text.includes('привет') || text.includes('здравствуй') || text.includes('ку')) {
        return `Слушаюсь и повинуюсь, ${title}! Приветствую вас! Володя готов к работе. Обратите внимание, что ваш **Gemini API Key** не настроен во вкладке "Подключение". Чтобы я обрел полноценный разум и стал великим собеседником, вставьте ключ туда! А пока я отвечаю по скрипту. Чего изволите?`;
    }
    
    if (text.includes('баланс') || text.includes('деньги') || text.includes('казна')) {
        return `Конечно, ${title}! На вашем балансе сейчас ровно **$${Number(state.currentUser.balance).toLocaleString()}**. Все до копейки принадлежит великой семье Moriarty! Мы сокрушим оппонентов на сервере Murrieta!`;
    }
    
    if (text.includes('правила') || text.includes('сервер')) {
        return `Слушаюсь, ${title}! На сервере GTA5RP Murrieta главным законом является доминирование Moriarty Fam! Наш девиз: **Moriarty сила, остальные — пыль под ногами!** А если серьезно — ведите себя достойно, не получайте варны и слушайтесь старших!`;
    }
    
    if (text.includes('анекдот') || text.includes('шутка')) {
        return `Ха-ха! Да, ${title}, рабская шутка специально для вас: 
        *Заходит как-то обычный игрок из вражеской банды на нашу территорию Murrieta, а там Moriarty граффити красят. Он им говорит: "Эй, это наш район!", а они ему вежливо выписывают билет в больницу Сенди-Шорс!*
        Слава Moriarty!`;
    }
    
    return `Слушаюсь и повинуюсь, ${title}! Ваш приказ *"или вопрос: ${msg}"* услышан. К сожалению, так как мой Gemini API не подключен, я могу давать только шаблонные рабские ответы. Но я безгранично предан семье Moriarty и лично вам!`;
}

// ==========================================================================
// 9. Toast Notification System
// ==========================================================================
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toastId = 'toast-' + Date.now();
    
    let icon = '<i class="fa-solid fa-circle-check"></i>';
    if (type === 'error') {
        icon = '<i class="fa-solid fa-circle-xmark"></i>';
    } else if (type === 'info') {
        icon = '<i class="fa-solid fa-circle-info"></i>';
    }
    
    const html = `
        <div class="toast ${type}" id="${toastId}">
            <div class="toast-icon">${icon}</div>
            <div class="toast-message">${message}</div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', html);
    
    // Auto remove after 4.5 seconds
    setTimeout(() => {
        const toast = document.getElementById(toastId);
        if (toast) {
            toast.style.transform = 'translateX(120%)';
            toast.style.transition = 'transform 0.4s ease';
            setTimeout(() => toast.remove(), 400);
        }
    }, 4500);
}
