import { Injectable } from '@angular/core';
import { AgendaEvent } from '../models/event.model';

@Injectable({ providedIn: 'root' })
export class IcsImportService {

  async parseFile(file: File): Promise<AgendaEvent[]> {
    const text = await file.text();
    return this.parseIcs(text);
  }

  private parseIcs(text: string): AgendaEvent[] {
    const events: AgendaEvent[] = [];
    // Normaliser les fins de ligne
    const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    // Dérouler les lignes pliées (RFC 5545 : continuation avec espace ou tab)
    const unfolded = lines.replace(/\n[ \t]/g, '');

    const blocks = unfolded.split('BEGIN:VEVENT');
    blocks.shift(); // retirer ce qui précède le premier VEVENT

    for (const block of blocks) {
      const end = block.indexOf('END:VEVENT');
      const content = end !== -1 ? block.slice(0, end) : block;
      const event = this.parseVEvent(content);
      if (event) events.push(event);
    }
    return events;
  }

  private parseVEvent(block: string): AgendaEvent | null {
    const get = (key: string): string => {
      // Cherche KEY ou KEY;PARAMS=...
      const regex = new RegExp(`^${key}(?:;[^:]*)?:(.*)$`, 'm');
      const match = block.match(regex);
      return match ? match[1].trim() : '';
    };

    const title = this.unescape(get('SUMMARY'));
    if (!title) return null;

    const dtstart = get('DTSTART');
    const dtend   = get('DTEND');
    const allDay  = dtstart.length === 8; // format YYYYMMDD = journée entière

    const start = this.parseDate(dtstart);
    const end   = dtend ? this.parseDate(dtend) : new Date(start.getTime() + 3600_000);

    const location    = this.unescape(get('LOCATION'));
    const description = this.unescape(get('DESCRIPTION'));

    return {
      title,
      start,
      end,
      allDay,
      location: location || undefined,
      notes: description || undefined,
      reminders: [{ minutesBefore: 30 }],
      category: 'autre',
    };
  }

  private parseDate(dt: string): Date {
    if (!dt) return new Date();
    // Format : 20260605T143000Z ou 20260605T143000 ou 20260605
    const s = dt.replace('Z', '');
    if (s.length === 8) {
      // Journée entière : YYYYMMDD
      return new Date(`${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}`);
    }
    // YYYYMMDDTHHMMSS
    return new Date(
      `${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}T${s.slice(9,11)}:${s.slice(11,13)}:${s.slice(13,15)}`
    );
  }

  private unescape(s: string): string {
    return s.replace(/\\n/g, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\');
  }
}
