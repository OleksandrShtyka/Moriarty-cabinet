import { Injectable, signal } from '@angular/core';

export interface User {
  id: string;
  email: string;
  character_name: string;
  static_id: string;
  role: 'OWNER' | 'Developer' | 'MODERATOR' | 'MEMBER';
  balance: number;
  warns_count: number;
  referred_by?: string | null;
  created_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Signal state management (Modern Angular standard)
  public currentUser = signal<User | null>(null);
  
  private get apiBase(): string {
    return window.location.port === '4200' ? 'http://localhost:3000' : '';
  }

  constructor() {
    this.checkSession();
  }

  private checkSession() {
    const saved = localStorage.getItem('moriarty_active_session');
    if (saved) {
      try {
        const user = JSON.parse(saved);
        this.currentUser.set(user);
        // Refresh profile async in background
        this.refreshProfile(user.id);
      } catch (e) {
        this.logout();
      }
    }
  }

  async refreshProfile(userId: string): Promise<User> {
    try {
      const res = await fetch(`${this.apiBase}/api/profiles/${userId}`);
      if (!res.ok) throw new Error();
      const updatedUser = await res.json();
      // Keep email from session
      if (this.currentUser()) {
        updatedUser.email = this.currentUser()!.email;
      }
      this.currentUser.set(updatedUser);
      localStorage.setItem('moriarty_active_session', JSON.stringify(updatedUser));
      return updatedUser;
    } catch (e) {
      return this.currentUser()!;
    }
  }

  async login(email: string, password: string): Promise<User> {
    const res = await fetch(`${this.apiBase}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Не удалось выполнить вход');
    }

    const data = await res.json();
    this.currentUser.set(data.user);
    localStorage.setItem('moriarty_active_session', JSON.stringify(data.user));
    return data.user;
  }

  async register(payload: { email: string; password: string; character_name: string; static_id: string; referral?: string }): Promise<void> {
    const res = await fetch(`${this.apiBase}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Не удалось зарегистрироваться');
    }
  }

  logout() {
    localStorage.removeItem('moriarty_active_session');
    this.currentUser.set(null);
  }
}
