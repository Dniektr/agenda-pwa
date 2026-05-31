import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder, FormGroup, FormArray,
  ReactiveFormsModule, Validators,
} from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { AgendaEvent, EventCategory, CATEGORY_COLORS } from '../../models/event.model';

export interface DialogData {
  event?: AgendaEvent;
  start?: Date;
  end?: Date;
}

@Component({
  selector: 'app-event-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, MatButtonModule,
    MatCheckboxModule, MatSelectModule, MatIconModule, MatChipsModule,
  ],
  templateUrl: './event-dialog.component.html',
  styleUrls: ['./event-dialog.component.scss'],
})
export class EventDialogComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;

  categories: EventCategory[] = ['personnel', 'travail', 'sante', 'social', 'autre'];
  categoryColors = CATEGORY_COLORS;

  reminderOptions = [
    { label: 'Au moment même', value: 0 },
    { label: '5 min avant',    value: 5 },
    { label: '15 min avant',   value: 15 },
    { label: '30 min avant',   value: 30 },
    { label: '1h avant',       value: 60 },
    { label: '2h avant',       value: 120 },
    { label: '1 jour avant',   value: 1440 },
    { label: '2 jours avant',  value: 2880 },
    { label: '1 semaine avant',value: 10080 },
  ];

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<EventDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {}

  ngOnInit(): void {
    this.isEdit = !!this.data.event?.id;
    const e = this.data.event;

    this.form = this.fb.group({
      title:    [e?.title ?? '', Validators.required],
      start:    [this.toInputDateTime(e?.start ?? this.data.start ?? new Date()), Validators.required],
      end:      [this.toInputDateTime(e?.end ?? this.data.end ?? new Date(Date.now() + 3600000)), Validators.required],
      allDay:   [e?.allDay ?? false],
      location: [e?.location ?? ''],
      category: [e?.category ?? 'personnel'],
      notes:    [e?.notes ?? ''],
      reminders: this.fb.array(
        (e?.reminders?.length ? e.reminders : [{ minutesBefore: 30 }])
          .map(r => this.fb.control(r.minutesBefore))
      ),
    });
  }

  get remindersArray(): FormArray {
    return this.form.get('reminders') as FormArray;
  }

  addReminder(): void {
    this.remindersArray.push(this.fb.control(60));
  }

  removeReminder(i: number): void {
    this.remindersArray.removeAt(i);
  }

  save(): void {
    if (this.form.invalid) return;
    const v = this.form.value;
    const event: AgendaEvent = {
      ...this.data.event,
      title:    v.title,
      start:    new Date(v.start),
      end:      new Date(v.end),
      allDay:   v.allDay,
      location: v.location,
      category: v.category,
      color:    this.categoryColors[v.category as EventCategory],
      notes:    v.notes,
      reminders: (v.reminders as number[]).map(m => ({ minutesBefore: m })),
    };
    this.dialogRef.close({ action: 'save', event });
  }

  delete(): void { this.dialogRef.close({ action: 'delete', event: this.data.event }); }
  cancel(): void { this.dialogRef.close(); }

  private toInputDateTime(date: Date): string {
    const d = new Date(date);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
}
