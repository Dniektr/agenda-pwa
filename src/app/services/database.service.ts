import { Injectable } from '@angular/core';
import Dexie, { Table } from 'dexie';
import { AgendaEvent } from '../models/event.model';

@Injectable({ providedIn: 'root' })
export class DatabaseService extends Dexie {
  events!: Table<AgendaEvent, number>;

  constructor() {
    super('AgendaDB');
    this.version(1).stores({
      events: '++id, title, start, end, allDay, category',
    });
  }

  async getAllEvents(): Promise<AgendaEvent[]> {
    const events = await this.events.toArray();
    return events.map(this.deserializeEvent);
  }

  async getEventsInRange(start: Date, end: Date): Promise<AgendaEvent[]> {
    const events = await this.events
      .where('start')
      .between(start, end, true, true)
      .toArray();
    return events.map(this.deserializeEvent);
  }

  async addEvent(event: AgendaEvent): Promise<number> {
    return this.events.add(this.serializeEvent(event));
  }

  async updateEvent(event: AgendaEvent): Promise<void> {
    await this.events.put(this.serializeEvent(event));
  }

  async deleteEvent(id: number): Promise<void> {
    await this.events.delete(id);
  }

  private serializeEvent(event: AgendaEvent): AgendaEvent {
    return {
      ...event,
      start: new Date(event.start),
      end: new Date(event.end),
    };
  }

  private deserializeEvent(event: AgendaEvent): AgendaEvent {
    return {
      ...event,
      start: new Date(event.start),
      end: new Date(event.end),
    };
  }
}
