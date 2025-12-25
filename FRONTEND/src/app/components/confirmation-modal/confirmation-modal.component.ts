import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirmation-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirmation-modal.component.html',
  styleUrls: ['./confirmation-modal.component.css']
})
export class ConfirmationModalComponent {
  @Input() isOpen: boolean = false;
  @Input() title: string = 'Bestätigung';
  @Input() message: string = 'Möchtest du diese Aktion wirklich ausführen?';
  @Input() confirmText: string = 'Bestätigen';
  @Input() cancelText: string = 'Abbrechen';
  @Input() isDangerous: boolean = false; // Red styling for dangerous actions
  @Input() isSuccess: boolean = false; // Green styling for success messages
  @Input() isFavorite: boolean = false; // Heart icon for favorites
  @Input() showCancelButton: boolean = true; // Hide cancel button for success messages
  @Input() iconType: 'success' | 'heart' | 'warning' | 'info' | 'danger' = 'success'; // Icon type

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  onConfirm(): void {
    this.confirm.emit();
  }

  onCancel(): void {
    this.cancel.emit();
  }

  get modalIcon(): string {
    if (this.isFavorite) return '♥';

    switch(this.iconType) {
      case 'success': return '✓';
      case 'heart': return '♥';
      case 'warning': return '⚠';
      case 'info': return 'ℹ';
      case 'danger': return '⚠';
      default: return '✓';
    }
  }

  get iconClass(): string {
    if (this.isFavorite) return 'favorite';
    if (this.isDangerous) return 'danger';
    if (this.isSuccess) return 'success';
    return this.iconType;
  }
}
