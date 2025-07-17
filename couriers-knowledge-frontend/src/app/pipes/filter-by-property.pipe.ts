import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filter',
  standalone: true
})
export class FilterByPropertyPipe implements PipeTransform {
  transform(items: any[], value: any, prop: string): any[] {
    if (!items) return [];
    if (!value === undefined || !prop) return items;
    return items.filter(item => item[prop] === value);
  }
}