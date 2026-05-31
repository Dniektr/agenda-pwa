import { Injectable } from '@angular/core';
import { AgendaEvent } from '../models/event.model';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private timers = new Map<string, ReturnType<typeof setTimeout>>();

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    const result = await Notification.requestPermission();
    return result === 'granted';
  }

  scheduleReminders(event: AgendaEvent): void {
    if (!event.id) return;

    // Annuler tous les anciens timers de cet événement
    for (const [key, timer] of this.timers) {
      if (key.startsWith(`evt-${event.id}-`)) {
        clearTimeout(timer);
        this.timers.delete(key);
      }
    }

    if (!event.reminders?.length) return;

    // Planifier chaque rappel
    event.reminders.forEach((reminder, index) => {
      const notifyAt = new Date(event.start).getTime() - reminder.minutesBefore * 60_000;
      const delay = notifyAt - Date.now();
      if (delay <= 0) return;

      const key = `evt-${event.id}-${index}`;
      const timer = setTimeout(() => {
        this.showNotification(event, reminder.minutesBefore);
        this.timers.delete(key);
      }, delay);
      this.timers.set(key, timer);
    });
  }

  cancelReminders(eventId: number): void {
    for (const [key, timer] of this.timers) {
      if (key.startsWith(`evt-${eventId}-`)) {
        clearTimeout(timer);
        this.timers.delete(key);
      }
    }
  }

  private showNotification(event: AgendaEvent, minutesBefore: number): void {
    if (Notification.permission !== 'granted') return;

    let label: string;
    if (minutesBefore === 0)          label = "C'est maintenant !";
    else if (minutesBefore < 60)      label = `Dans ${minutesBefore} min`;
    else if (minutesBefore < 1440)    label = `Dans ${minutesBefore / 60}h`;
    else if (minutesBefore === 1440)  label = 'Demain';
    else if (minutesBefore === 2880)  label = 'Dans 2 jours';
    else                              label = `Dans ${minutesBefore / 10080} semaine(s)`;

    new Notification(`📅 ${event.title}`, {
      body: `${label}${event.location ? ' · ' + event.location : ''}`,
      icon: '/icons/icon-192x192.png',
      tag:  `evt-${event.id}-${minutesBefore}`,
    });
  }
}
