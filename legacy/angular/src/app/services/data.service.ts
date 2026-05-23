import { Injectable } from '@angular/core';

export interface Transaction {
  id: string;
  user_id: string;
  type: 'DEPOSIT' | 'WITHDRAW' | 'TRANSFER';
  amount: number;
  description: string;
  created_at: string;
}

export interface Warn {
  id: string;
  user_id: string;
  reason: string;
  issued_by: string;
  issued_at: string;
  status: 'ACTIVE' | 'EXPIRED';
}

export interface Feedback {
  id: string;
  user_id: string;
  type: 'SUGGESTION' | 'COMPLAINT';
  target_member?: string;
  text: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  admin_comment?: string;
  created_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private get apiBase(): string {
    return window.location.port === '4200' ? 'http://localhost:3000' : '';
  }

  // --- Transactions ---
  async getTransactions(userId: string): Promise<Transaction[]> {
    const res = await fetch(`${this.apiBase}/api/transactions/${userId}`);
    if (!res.ok) throw new Error('Не удалось получить историю транзакций');
    return res.json();
  }

  async deposit(userId: string, amount: number): Promise<{ success: boolean; balance: number }> {
    const res = await fetch(`${this.apiBase}/api/balance/deposit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, amount })
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Ошибка вклада');
    }
    return res.json();
  }

  async transfer(senderId: string, targetStaticId: string, amount: number): Promise<{ success: boolean; newBalance: number }> {
    const res = await fetch(`${this.apiBase}/api/balance/transfer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senderId, targetStaticId, amount })
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Ошибка перевода');
    }
    return res.json();
  }

  // --- Warns ---
  async getWarns(userId: string): Promise<Warn[]> {
    const res = await fetch(`${this.apiBase}/api/warns/${userId}`);
    if (!res.ok) throw new Error('Не удалось получить выговоры');
    return res.json();
  }

  // --- Feedback ---
  async getFeedback(userId: string): Promise<Feedback[]> {
    const res = await fetch(`${this.apiBase}/api/feedback/${userId}`);
    if (!res.ok) throw new Error('Не удалось получить отзывы');
    return res.json();
  }

  async submitFeedback(userId: string, type: 'SUGGESTION' | 'COMPLAINT', targetMember: string, text: string): Promise<void> {
    const res = await fetch(`${this.apiBase}/api/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, type, targetMember, text })
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Ошибка отправки обращения');
    }
  }

  // --- Referrals ---
  async getReferrals(userId: string): Promise<any[]> {
    const res = await fetch(`${this.apiBase}/api/referrals/${userId}`);
    if (!res.ok) throw new Error('Не удалось получить рефералов');
    return res.json();
  }

  // --- Admin ---
  async getAdminUsers(adminUserId: string): Promise<any[]> {
    const res = await fetch(`${this.apiBase}/api/admin/users`, {
      headers: { 'x-admin-userid': adminUserId }
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Отказано в доступе к составу');
    }
    return res.json();
  }

  async saveAdminUserSettings(adminUserId: string, targetUserId: string, role: string, warns: number, balance: number): Promise<void> {
    const res = await fetch(`${this.apiBase}/api/admin/users/update`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-admin-userid': adminUserId
      },
      body: JSON.stringify({ targetUserId, role, warns, balance })
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Не удалось обновить профиль');
    }
  }

  async getSystemPrompt(): Promise<string> {
    const res = await fetch(`${this.apiBase}/api/admin/system-prompt`);
    if (!res.ok) throw new Error('Ошибка чтения промпта');
    const data = await res.json();
    return data.systemPrompt;
  }

  async saveSystemPrompt(adminUserId: string, prompt: string): Promise<void> {
    const res = await fetch(`${this.apiBase}/api/admin/system-prompt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-userid': adminUserId
      },
      body: JSON.stringify({ prompt })
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Не удалось сохранить промпт');
    }
  }

  // --- Connections Configuration ---
  async getConfig(): Promise<any> {
    const res = await fetch(`${this.apiBase}/api/config`);
    if (!res.ok) throw new Error('Ошибка конфигурации');
    return res.json();
  }

  async saveConfig(payload: any): Promise<any> {
    const res = await fetch(`${this.apiBase}/api/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Не удалось обновить подключение');
    return res.json();
  }

  async resetConfig(): Promise<void> {
    const res = await fetch(`${this.apiBase}/api/config/reset`, { method: 'POST' });
    if (!res.ok) throw new Error('Ошибка сброса подключения');
  }
}
