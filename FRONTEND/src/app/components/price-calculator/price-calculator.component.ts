import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RequestService, PriceBreakdown } from '../../services/request.service';

@Component({
  selector: 'app-price-calculator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './price-calculator.component.html',
  styleUrls: ['./price-calculator.component.css']
})
export class PriceCalculatorComponent implements OnInit {
  @Input() gewicht: number = 0;
  @Input() entfernung: string = '';
  @Input() kategorie: string = 'Pakete';
  @Output() priceCalculated = new EventEmitter<number>();

  priceBreakdown: PriceBreakdown | null = null;
  isCalculating: boolean = false;
  showBreakdown: boolean = false;

  constructor(private requestService: RequestService) {}

  ngOnInit(): void {
    // Calculate initial price if values are provided
    if (this.gewicht > 0 && this.entfernung) {
      this.calculatePrice();
    }
  }

  calculatePrice(): void {
    if (!this.gewicht || !this.entfernung || !this.kategorie) {
      return;
    }

    this.isCalculating = true;

    this.requestService.calculatePrice({
      gewicht: this.gewicht,
      entfernung: this.entfernung,
      kategorie: this.kategorie
    }).subscribe({
      next: (breakdown) => {
        this.priceBreakdown = breakdown;
        this.priceCalculated.emit(breakdown.totalPrice);
        this.isCalculating = false;
      },
      error: (error) => {
        console.error('Error calculating price:', error);
        this.isCalculating = false;
      }
    });
  }

  toggleBreakdown(): void {
    this.showBreakdown = !this.showBreakdown;
  }

  getCategoryIcon(category: string): string {
    const icons: { [key: string]: string } = {
      'Möbel': '🪑',
      'Umzug': '📦',
      'Pakete': '📮',
      'Sonstiges': '📋'
    };
    return icons[category] || '📋';
  }

  getCategoryMultiplierText(multiplier: number): string {
    if (multiplier === 1.0) return 'Standard';
    const percentage = ((multiplier - 1) * 100).toFixed(0);
    return `+${percentage}%`;
  }
}
