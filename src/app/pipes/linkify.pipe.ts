import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({ name: 'linkify', standalone: true })
export class LinkifyPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(text: string): SafeHtml {
    if (!text) return '';
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/\n/g, '<br>')
      .replace(urlRegex, url =>
        `<a href="${url}" target="_blank" rel="noopener" class="event-link">🔗 ${this.shortUrl(url)}</a>`
      );
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  private shortUrl(url: string): string {
    try {
      const u = new URL(url);
      return u.hostname + (u.pathname.length > 20 ? u.pathname.slice(0, 20) + '…' : u.pathname);
    } catch { return url.slice(0, 40); }
  }
}
