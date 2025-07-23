import { Pipe, PipeTransform } from '@angular/core';
import { I18nService } from '../core/i18n.service';

@Pipe({
  name: 'translate',
  standalone: true,
  pure: false
})
export class TranslatePipe implements PipeTransform {
  constructor(private i18nService: I18nService) {}

  transform(key: string, params?: { [key: string]: string }): string {
    return this.i18nService.translate(key, params);
  }
}
