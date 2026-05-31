import { Component, OnInit, signal, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventClickArg, DateSelectArg, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import frLocale from '@fullcalendar/core/locales/fr';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EventDialogComponent } from '../event-dialog/event-dialog.component';
import { EventService } from '../../services/event.service';
import { NotificationService } from '../../services/notification.service';
import { IcsImportService } from '../../services/ics-import.service';
import { AgendaEvent, CATEGORY_COLORS } from '../../models/event.model';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [
    CommonModule, FullCalendarModule,
    MatButtonModule, MatIconModule, MatSnackBarModule, MatTooltipModule,
  ],
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss'],
})
export class CalendarComponent implements OnInit {
  @ViewChild('icsInput') icsInput!: ElementRef<HTMLInputElement>;

  calendarOptions = signal<CalendarOptions>({
    plugins: [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    locale: frLocale,
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,listWeek',
    },
    selectable: true,
    selectMirror: true,
    editable: true,
    dayMaxEvents: true,
    events: [],
    select: (arg) => this.onDateSelect(arg),
    eventClick: (arg) => this.onEventClick(arg),
    eventDrop: (arg) => this.onEventDrop(arg),
    eventResize: (arg) => this.onEventResize(arg),
    height: 'auto',
  });

  importing = false;

  constructor(
    private eventService: EventService,
    private notifService: NotificationService,
    private icsService: IcsImportService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.notifService.requestPermission();
    this.refreshCalendar();
  }

  private refreshCalendar(): void {
    const fcEvents: EventInput[] = this.eventService.events().map((e) => ({
      id: String(e.id),
      title: e.title,
      start: e.start,
      end: e.end,
      allDay: e.allDay,
      backgroundColor: e.color ?? CATEGORY_COLORS[e.category ?? 'autre'],
      borderColor: e.color ?? CATEGORY_COLORS[e.category ?? 'autre'],
      extendedProps: { event: e },
    }));
    this.calendarOptions.update((opts) => ({ ...opts, events: fcEvents }));
  }

  onDateSelect(arg: DateSelectArg): void {
    const ref = this.dialog.open(EventDialogComponent, {
      data: { start: arg.start, end: arg.end },
      width: '480px', maxWidth: '95vw',
    });
    ref.afterClosed().subscribe(async (result) => {
      if (result?.action === 'save') {
        await this.eventService.add(result.event);
        this.refreshCalendar();
        this.snackBar.open('Rendez-vous ajouté ✓', '', { duration: 2000 });
      }
    });
  }

  onEventClick(arg: EventClickArg): void {
    const event: AgendaEvent = arg.event.extendedProps['event'];
    const ref = this.dialog.open(EventDialogComponent, {
      data: { event }, width: '480px', maxWidth: '95vw',
    });
    ref.afterClosed().subscribe(async (result) => {
      if (result?.action === 'save') {
        await this.eventService.update(result.event);
        this.refreshCalendar();
        this.snackBar.open('Rendez-vous modifié ✓', '', { duration: 2000 });
      } else if (result?.action === 'delete') {
        await this.eventService.delete(event.id!);
        this.refreshCalendar();
        this.snackBar.open('Rendez-vous supprimé', '', { duration: 2000 });
      }
    });
  }

  async onEventDrop(arg: any): Promise<void> {
    const event: AgendaEvent = { ...arg.event.extendedProps['event'], start: arg.event.start, end: arg.event.end };
    await this.eventService.update(event);
    this.refreshCalendar();
  }

  async onEventResize(arg: any): Promise<void> {
    const event: AgendaEvent = { ...arg.event.extendedProps['event'], start: arg.event.start, end: arg.event.end };
    await this.eventService.update(event);
    this.refreshCalendar();
  }

  openNewEvent(): void {
    const now = new Date();
    const end = new Date(now.getTime() + 3600000);
    const ref = this.dialog.open(EventDialogComponent, {
      data: { start: now, end }, width: '480px', maxWidth: '95vw',
    });
    ref.afterClosed().subscribe(async (result) => {
      if (result?.action === 'save') {
        await this.eventService.add(result.event);
        this.refreshCalendar();
        this.snackBar.open('Rendez-vous ajouté ✓', '', { duration: 2000 });
      }
    });
  }

  // ── Import ICS ──────────────────────────────────────────────
  triggerIcsImport(): void {
    this.icsInput.nativeElement.click();
  }

  async onIcsFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    this.importing = true;
    let imported = 0;

    try {
      for (const file of Array.from(input.files)) {
        const events = await this.icsService.parseFile(file);
        for (const ev of events) {
          await this.eventService.add(ev);
          imported++;
        }
      }
      this.refreshCalendar();
      this.snackBar.open(
        imported === 1 ? '1 événement importé ✓' : `${imported} événements importés ✓`,
        '', { duration: 3000 }
      );
    } catch (e) {
      this.snackBar.open('Erreur lors de l\'import du fichier', '', { duration: 3000 });
    } finally {
      this.importing = false;
      input.value = ''; // reset pour pouvoir réimporter le même fichier
    }
  }
}
