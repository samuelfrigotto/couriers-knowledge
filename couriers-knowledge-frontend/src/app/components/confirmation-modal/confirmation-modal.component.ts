// confirmation-modal.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { I18nService } from '../../core/i18n.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirmation-modal',
  standalone: true,
  imports: [
    TranslatePipe,
    CommonModule
  ],
  templateUrl: './confirmation-modal.component.html',
  styleUrls: ['./confirmation-modal.component.css']
})
export class ConfirmationModalComponent {
  @Input() isVisible: boolean = false;
  @Input() title: string = '';
  @Input() message: string = '';
  @Input() confirmText: string = '';
  @Input() cancelText: string = '';
  @Input() confirmButtonType: 'danger' | 'primary' | 'warning' = 'danger';
  @Input() icon: string = '⚠️';
  @Input() isLoading: boolean = false;

  @Output() onConfirm = new EventEmitter<void>();
  @Output() onCancel = new EventEmitter<void>();
  @Output() onClose = new EventEmitter<void>();

  constructor(private i18nService: I18nService) {}

  public confirm(): void {
    if (this.isLoading) return;
    this.onConfirm.emit();
  }

  public cancel(): void {
    if (this.isLoading) return;
    this.onCancel.emit();
  }

  public close(): void {
    if (this.isLoading) return;
    this.onClose.emit();
  }

  public handleOverlayClick(event: Event): void {
    // Fechar modal ao clicar no overlay
    if (event.target === event.currentTarget) {
      this.close();
    }
  }
}
