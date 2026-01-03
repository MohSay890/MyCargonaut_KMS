import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css']
})
export class LandingComponent {
  searchFrom: string = '';
  searchTo: string = '';
  searchDate: string = '';
  searchCategory: string = '';

  constructor(private router: Router) {}

  onSearch(): void {
    console.log('Search:', this.searchFrom, this.searchTo, this.searchDate, this.searchCategory);

    // Navigate to search results with query params
    this.router.navigate(['/search'], {
      queryParams: {
        from: this.searchFrom || '',
        to: this.searchTo || '',
        date: this.searchDate || '',
        category: this.searchCategory || ''
      }
    });
  }
}
