import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'highlight',
  standalone: true
})
export class HighlightPipe implements PipeTransform {
  
  constructor(private sanitizer: DomSanitizer) {}

  transform(text: string, searchTerm: string): SafeHtml {
    if (!searchTerm || !text) {
      return text;
    }

    const regex = new RegExp(`(${this.escapeRegex(searchTerm)})`, 'gi');
    const highlighted = text.replace(regex, '<mark class="search-highlight">$1</mark>');
    
    return this.sanitizer.bypassSecurityTrustHtml(highlighted);
  }

  private escapeRegex(term: string): string {
    return term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}