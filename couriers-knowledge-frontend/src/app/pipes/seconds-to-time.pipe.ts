import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'secondsToTime',
  standalone: true
})
export class SecondsToTimePipe implements PipeTransform {
  transform(value: number): string {
    if (isNaN(value) || value < 0) {
      return '00:00';
    }
    const minutes: number = Math.floor(value / 60);
    const seconds: number = Math.floor(value % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
}