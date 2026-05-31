import { Injectable, signal } from '@angular/core';
import { AgendaEvent } from '../models/event.model';
import { DatabaseService } from './database.service';
import { NotificationService } from './notification.service';

@Injectable({ providedIn: 'root' })
export class EventService {
  events = signal<AgendaEvent[]>([]);

  constructor(
    private db: DatabaseService,
    private notif: NotificationService
  ) {
    this.loadAll();
  }

  async loadAll(): Promise<void> {
    const events = await this.db.getAllEvents();
    this.events.set(events);
  }

  async add(event: AgendaEvent): Promise<void> {
    const id = await this.db.addEvent(event);
    event.id = id;
    this.events.update((list) => [...list, event]);
    this.notif.scheduleReminders(event);
  }

  async update(event: AgendaEvent): Promise<void> {
    await this.db.updateEvent(event);
    this.events.update((list) =>
      list.map((e) => (e.id === event.id ? event : e))
    );
    this.notif.scheduleReminders(event);
  }

  async delete(id: number): Promise<void> {
    await this.db.deleteEvent(id);
    this.events.update((list) => list.filter((e) => e.id !== id));
  }
}
