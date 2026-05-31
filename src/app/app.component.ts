import { Component } from '@angular/core';
import { CalendarComponent } from './components/calendar/calendar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CalendarComponent],
  template: `<app-calendar />`,
  styles: [`
    :host { display: block; height: 100vh; overflow-y: auto; }
  `]
})
export class AppComponent {}
