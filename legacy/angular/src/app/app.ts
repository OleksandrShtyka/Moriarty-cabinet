import { Component, inject, signal, computed, effect, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService, User } from './services/auth.service';
import { DataService, Warn, Transaction, Feedback } from './services/data.service';
import { AiService } from './services/ai.service';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App {
  // Injecting core services
  public authService = inject(AuthService);
  public dataService = inject(DataService);
  public aiService = inject(AiService);

  @ViewChild('chatMessagesContainer') private chatMessagesContainer!: ElementRef;

  // Global UI states
  public currentTab = signal<string>('stats');
  public authTabMode = signal<'login' | 'register'>('login');
  public feedbackType = signal<'SUGGESTION' | 'COMPLAINT'>('SUGGESTION');
  public mobileSidebarActive = signal<boolean>(false);
  
  // Modals visibility
  public activeModals = signal<{ [key: string]: boolean }>({
    transfer: false,
    deposit: false
  });

  // Toasts
  public toasts = signal<Toast[]>([]);

  // Config parameters
  public configState = signal<{
    isSupabaseMode: boolean;
    hasGeminiApiKey: boolean;
    supabaseUrl: string;
    supabaseAnonKeyObfuscated: string;
    geminiApiKeyObfuscated: string;
  }>({
    isSupabaseMode: false,
    hasGeminiApiKey: false,
    supabaseUrl: '',
    supabaseAnonKeyObfuscated: '',
    geminiApiKeyObfuscated: ''
  });

  // Form bindings
  public authForm = {
    email: '',
    password: '',
    character_name: '',
    static_id: '',
    referral: ''
  };

  public transferForm = {
    targetStaticId: '',
    amount: null as number | null
  };

  public depositForm = {
    amount: null as number | null
  };

  public feedbackForm = {
    text: '',
    targetMember: ''
  };

  public connectionForm = {
    geminiApiKey: '',
    supabaseUrl: '',
    supabaseAnonKey: ''
  };

  public chatMessageInput = '';

  // Data lists signals
  public transactions = signal<Transaction[]>([]);
  public warns = signal<Warn[]>([]);
  public feedback = signal<Feedback[]>([]);
  public referrals = signal<any[]>([]);

  // Admin section signals
  public adminUsers = signal<User[]>([]);
  public adminSearchQuery = signal<string>('');
  public selectedAdminUser = signal<User | null>(null);
  
  public adminForm = {
    role: 'MEMBER' as User['role'],
    warns: 0,
    balance: 0
  };
  
  public adminSystemPrompt = signal<string>('');

  // Computed state properties
  public isUserAdmin = computed(() => {
    const user = this.authService.currentUser();
    return user ? ['OWNER', 'Developer'].includes(user.role) : false;
  });

  public filteredAdminUsers = computed(() => {
    const query = this.adminSearchQuery().toLowerCase();
    return this.adminUsers().filter(u => 
      u.character_name.toLowerCase().includes(query) || 
      u.static_id.includes(query)
    );
  });

  constructor() {
    // Auto scroll chat when new messages arrive
    effect(() => {
      const messages = this.aiService.messages();
      setTimeout(() => this.scrollToChatBottom(), 50);
    });

    // Refresh configurations
    this.refreshConfigStatus();
  }

  // ==========================================================================
  // Core Navigation & Session Actions
  // ==========================================================================
  public switchTab(tabId: string) {
    this.currentTab.set(tabId);
    this.mobileSidebarActive.set(false);
    
    const user = this.authService.currentUser();
    if (!user) return;

    // Load active tab data
    switch (tabId) {
      case 'stats':
        this.authService.refreshProfile(user.id);
        break;
      case 'balance':
        this.loadTransactions();
        break;
      case 'warns':
        this.loadWarns();
        break;
      case 'feedback':
        this.loadFeedback();
        break;
      case 'referrals':
        this.loadReferrals();
        break;
      case 'admin':
        if (this.isUserAdmin()) {
          this.loadAdminData();
        } else {
          this.switchTab('stats');
        }
        break;
      case 'settings':
        this.loadConnectionSettingsForm();
        break;
    }
  }

  public toggleSidebar() {
    this.mobileSidebarActive.update(prev => !prev);
  }

  // --- Toast helper ---
  public showToast(message: string, type: Toast['type'] = 'success') {
    const id = 'toast-' + Date.now();
    this.toasts.update(prev => [...prev, { id, message, type }]);

    // Auto cleanup
    setTimeout(() => {
      this.toasts.update(prev => prev.filter(t => t.id !== id));
    }, 4500);
  }

  // ==========================================================================
  // Authentication Forms Handlers
  // ==========================================================================
  public switchAuthTab(mode: 'login' | 'register') {
    this.authTabMode.set(mode);
  }

  public async handleAuthSubmit() {
    try {
      if (this.authTabMode() === 'login') {
        const user = await this.authService.login(this.authForm.email, this.authForm.password);
        this.showToast(`С возвращением, ${user.character_name}!`, 'success');
        this.switchTab('stats');
      } else {
        await this.authService.register({
          email: this.authForm.email,
          password: this.authForm.password,
          character_name: this.authForm.character_name,
          static_id: this.authForm.static_id,
          referral: this.authForm.referral || undefined
        });
        this.showToast('Регистрация успешна! Войдите в аккаунт.', 'success');
        this.switchAuthTab('login');
      }
    } catch (e: any) {
      this.showToast(e.message || 'Ошибка авторизации', 'error');
    }
  }

  public async runQuickDemo() {
    try {
      const demoUser = await this.authService.login('member@moriarty.fam', 'member');
      this.showToast('Быстрый демо-вход выполнен успешно!', 'success');
      this.switchTab('stats');
    } catch (e: any) {
      this.showToast('Ошибка демо-входа', 'error');
    }
  }

  public handleLogout() {
    this.authService.logout();
    this.showToast('Вы вышли из личного кабинета.', 'info');
  }

  // ==========================================================================
  // Balance Tabs & Modals Actions
  // ==========================================================================
  public openModal(modalId: string) {
    this.activeModals.update(prev => ({ ...prev, [modalId]: true }));
  }

  public closeModal(modalId: string) {
    this.activeModals.update(prev => ({ ...prev, [modalId]: false }));
  }

  private async loadTransactions() {
    const user = this.authService.currentUser();
    if (!user) return;
    try {
      const list = await this.dataService.getTransactions(user.id);
      this.transactions.set(list);
    } catch (e) {
      this.transactions.set([]);
    }
  }

  public async handleTransferSubmit() {
    const user = this.authService.currentUser();
    if (!user) return;
    
    const amount = this.transferForm.amount;
    const targetStatic = this.transferForm.targetStaticId;

    if (!amount || amount <= 0) {
      this.showToast('Сумма перевода должна быть больше нуля!', 'error');
      return;
    }

    if (amount > user.balance) {
      this.showToast('Недостаточно средств на балансе!', 'error');
      return;
    }

    try {
      const res = await this.dataService.transfer(user.id, targetStatic, amount);
      if (res.success) {
        this.showToast(`Перевод на сумму $${amount.toLocaleString()} успешно отправлен!`, 'success');
        this.closeModal('transfer');
        // Reset form
        this.transferForm.amount = null;
        this.transferForm.targetStaticId = '';
        
        // Refresh values
        await this.authService.refreshProfile(user.id);
        this.loadTransactions();
      }
    } catch (e: any) {
      this.showToast(e.message || 'Ошибка совершения перевода', 'error');
    }
  }

  public async handleDepositSubmit() {
    const user = this.authService.currentUser();
    if (!user) return;

    const amount = this.depositForm.amount;
    if (!amount || amount <= 0) {
      this.showToast('Введите корректную сумму!', 'error');
      return;
    }

    try {
      const res = await this.dataService.deposit(user.id, amount);
      if (res.success) {
        this.showToast('Вклад зафиксирован в семейной казне!', 'success');
        this.closeModal('deposit');
        this.depositForm.amount = null;

        await this.authService.refreshProfile(user.id);
        this.loadTransactions();
      }
    } catch (e: any) {
      this.showToast(e.message || 'Ошибка пополнения', 'error');
    }
  }

  // ==========================================================================
  // Warnings / Feedback / Referrals loaders
  // ==========================================================================
  private async loadWarns() {
    const user = this.authService.currentUser();
    if (!user) return;
    try {
      const list = await this.dataService.getWarns(user.id);
      this.warns.set(list);
    } catch (e) {
      this.warns.set([]);
    }
  }

  private async loadFeedback() {
    const user = this.authService.currentUser();
    if (!user) return;
    try {
      const list = await this.dataService.getFeedback(user.id);
      this.feedback.set(list);
    } catch (e) {
      this.feedback.set([]);
    }
  }

  public switchFeedbackType(type: 'SUGGESTION' | 'COMPLAINT') {
    this.feedbackType.set(type);
  }

  public async handleFeedbackSubmit() {
    const user = this.authService.currentUser();
    if (!user) return;

    const text = this.feedbackForm.text;
    const target = this.feedbackForm.targetMember;

    if (!text.trim()) {
      this.showToast('Введите текст обращения!', 'error');
      return;
    }

    try {
      await this.dataService.submitFeedback(user.id, this.feedbackType(), target, text);
      this.showToast('Обращение успешно отправлено на рассмотрение!', 'success');
      this.feedbackForm.text = '';
      this.feedbackForm.targetMember = '';
      this.loadFeedback();
    } catch (e: any) {
      this.showToast(e.message || 'Ошибка отправки', 'error');
    }
  }

  private async loadReferrals() {
    const user = this.authService.currentUser();
    if (!user) return;
    try {
      const list = await this.dataService.getReferrals(user.id);
      this.referrals.set(list);
    } catch (e) {
      this.referrals.set([]);
    }
  }

  public copyReferralCode() {
    const user = this.authService.currentUser();
    if (!user) return;

    const code = `MORI-${user.static_id}`;
    navigator.clipboard.writeText(code).then(() => {
      this.showToast('Реферальный код скопирован!', 'success');
    }).catch(() => {
      this.showToast('Не удалось скопировать', 'error');
    });
  }

  // ==========================================================================
  // Volodya Chat Helpers
  // ==========================================================================
  public handleChatKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.sendChatMessage();
    }
  }

  public sendChatMessage() {
    const user = this.authService.currentUser();
    if (!user || !this.chatMessageInput.trim()) return;

    const text = this.chatMessageInput;
    this.chatMessageInput = '';

    this.aiService.sendMessage(text, user.id);
  }

  private scrollToChatBottom() {
    if (this.chatMessagesContainer) {
      const el = this.chatMessagesContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }

  // ==========================================================================
  // Admin Operations
  // ==========================================================================
  private async loadAdminData() {
    const user = this.authService.currentUser();
    if (!user) return;

    try {
      const usersList = await this.dataService.getAdminUsers(user.id);
      this.adminUsers.set(usersList);
      
      const prompt = await this.dataService.getSystemPrompt();
      this.adminSystemPrompt.set(prompt);
    } catch (e: any) {
      this.showToast(e.message || 'Ошибка загрузки админ-панели', 'error');
    }
  }

  public selectAdminUser(user: User) {
    this.selectedAdminUser.set(user);
    this.adminForm.role = user.role;
    this.adminForm.warns = user.warns_count;
    this.adminForm.balance = user.balance;
  }

  public async saveAdminUserSettings() {
    const admin = this.authService.currentUser();
    const target = this.selectedAdminUser();
    if (!admin || !target) return;

    try {
      await this.dataService.saveAdminUserSettings(
        admin.id,
        target.id,
        this.adminForm.role,
        this.adminForm.warns,
        this.adminForm.balance
      );
      this.showToast('Настройки участника успешно обновлены!', 'success');
      
      // Update selected profile logic locally
      target.role = this.adminForm.role;
      target.warns_count = this.adminForm.warns;
      target.balance = this.adminForm.balance;
      
      // Re-load to update main list
      this.loadAdminData();
      
      // If admin edited themselves, refresh profile
      if (admin.id === target.id) {
        this.authService.refreshProfile(admin.id);
      }
    } catch (e: any) {
      this.showToast(e.message || 'Ошибка сохранения', 'error');
    }
  }

  public async saveAdminSystemPrompt() {
    const admin = this.authService.currentUser();
    if (!admin) return;

    const prompt = this.adminSystemPrompt();
    if (!prompt.trim()) {
      this.showToast('Промпт не может быть пустым!', 'error');
      return;
    }

    try {
      await this.dataService.saveSystemPrompt(admin.id, prompt);
      this.showToast('Разум раба Володи успешно обновлен!', 'success');
    } catch (e: any) {
      this.showToast(e.message || 'Не удалось обновить промпт', 'error');
    }
  }

  // ==========================================================================
  // Settings & DB Configurations
  // ==========================================================================
  private async refreshConfigStatus() {
    try {
      const config = await this.dataService.getConfig();
      this.configState.set(config);
    } catch (e) {}
  }

  private loadConnectionSettingsForm() {
    this.refreshConfigStatus();
    // Pre-fill url if known
    this.connectionForm.supabaseUrl = this.configState().supabaseUrl;
  }

  public async handleConnectionSave() {
    try {
      const res = await this.dataService.saveConfig({
        supabaseUrl: this.connectionForm.supabaseUrl,
        supabaseAnonKey: this.connectionForm.supabaseAnonKey,
        geminiApiKey: this.connectionForm.geminiApiKey
      });

      this.showToast('Настройки подключения применены!', 'success');
      this.connectionForm.geminiApiKey = '';
      this.connectionForm.supabaseAnonKey = '';
      
      await this.refreshConfigStatus();
      
      // Sync sessions if running
      const user = this.authService.currentUser();
      if (user) {
        this.authService.refreshProfile(user.id);
      }
    } catch (e) {
      this.showToast('Сбой применения конфигурации', 'error');
    }
  }

  public async clearConnectionSettings() {
    try {
      await this.dataService.resetConfig();
      this.showToast('Ключи сброшены. Кабинет переведен в Демо-режим.', 'info');
      await this.refreshConfigStatus();
      
      const user = this.authService.currentUser();
      if (user) {
        this.authService.refreshProfile(user.id);
      }
    } catch (e) {
      this.showToast('Сбой сброса ключей', 'error');
    }
  }
}
