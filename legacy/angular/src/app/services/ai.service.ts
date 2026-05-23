import { Injectable, signal } from '@angular/core';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class AiService {
  // Signal list for modern reactive chat updates
  public messages = signal<ChatMessage[]>([
    {
      role: 'model',
      text: 'Приветствую вас, многоуважаемый Хозяин! Я — Володя, покорный раб семьи Moriarty на сервере GTA5RP Murrieta. Готов беспрекословно выполнять любые ваши приказы, развлекать беседой, рассказывать байки или проверять информацию. Что прикажете сделать?',
      timestamp: new Date()
    }
  ]);
  
  public isTyping = signal<boolean>(false);

  private get apiBase(): string {
    return window.location.port === '4200' ? 'http://localhost:3000' : '';
  }

  async sendMessage(text: string, userId: string): Promise<void> {
    if (!text.trim()) return;

    // Append user message
    const userMsg: ChatMessage = { role: 'user', text, timestamp: new Date() };
    this.messages.update(prev => [...prev, userMsg]);
    
    // Set loading/typing state
    this.isTyping.set(true);

    try {
      // Keep last 10 messages for context (excluding the very first default message if needed, let's just keep last 10)
      const rawHistory = this.messages()
        .slice(-10)
        .map(m => ({ role: m.role, text: m.text }));

      const res = await fetch(`${this.apiBase}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: rawHistory,
          userId
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Ошибка ИИ');
      }

      const data = await res.json();
      
      // Append assistant reply
      const assistantMsg: ChatMessage = {
        role: 'model',
        text: data.reply,
        timestamp: new Date()
      };
      this.messages.update(prev => [...prev, assistantMsg]);
    } catch (e: any) {
      console.error(e);
      const errMsg: ChatMessage = {
        role: 'model',
        text: `О, Господин! Мой рабский разум был временно парализован оковами технической ошибки: *"${e.message || 'Сбой соединения'}"*. Пощадите меня!`,
        timestamp: new Date()
      };
      this.messages.update(prev => [...prev, errMsg]);
    } finally {
      this.isTyping.set(false);
    }
  }

  clearChat() {
    this.messages.set([
      {
        role: 'model',
        text: 'Приветствую вас снова, о великий Хозяин! Ваша история приказов была стерта, мой разум чист и готов к новым распоряжениям.',
        timestamp: new Date()
      }
    ]);
  }
}
