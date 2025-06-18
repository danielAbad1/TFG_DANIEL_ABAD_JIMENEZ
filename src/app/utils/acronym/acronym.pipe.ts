import { Pipe, PipeTransform } from '@angular/core';
@Pipe({
  name: 'acronym',
  standalone: true,
})
export class AcronymPipe implements PipeTransform {
  transform(value: string): string {
    if (!value) return '';
    return value
      .split(/\s+/)
      .map((w) => w[0]?.toUpperCase() || '')
      .join('');
  }
}
