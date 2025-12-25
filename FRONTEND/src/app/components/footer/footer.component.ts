import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent {
  currentYear: number = new Date().getFullYear();

  socialLinks = [
    { name: 'Facebook', icon: '📘', url: '#' },
    { name: 'Twitter', icon: '🐦', url: '#' },
    { name: 'Instagram', icon: '📷', url: '#' },
    { name: 'LinkedIn', icon: '💼', url: '#' }
  ];

  quickLinks = [
    { label: 'Über uns', route: '/how-it-works' },
    { label: 'So funktioniert\'s', route: '/how-it-works' },
    { label: 'Transporte suchen', route: '/search' },
    { label: 'Transport anbieten', route: '/offer/create' }
  ];

  legalLinks = [
    { label: 'Impressum', route: '/impressum' },
    { label: 'Datenschutz', route: '/datenschutz' },
    { label: 'AGB', route: '/agb' },
    { label: 'Cookie-Richtlinien', route: '/cookies' }
  ];

  supportLinks = [
    { label: 'Hilfe & FAQ', route: '/help' },
    { label: 'Kontakt', route: '/contact' },
    { label: 'Feedback', route: '/feedback' }
  ];
}
