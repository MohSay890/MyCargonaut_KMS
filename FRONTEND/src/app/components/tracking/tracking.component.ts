import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';

interface StatusUpdate {
  status: 'abgeholt' | 'unterwegs' | 'zugestellt';
  title: string;
  time: string;
  location: string;
  details?: string;
  icon: string;
  color: string;
  current: boolean;
}

interface Notification {
  time: string;
  message: string;
}

@Component({
  selector: 'app-tracking',
  standalone: true,
  imports: [CommonModule, RouterLink, SidebarComponent],
  templateUrl: './tracking.component.html',
  styleUrls: ['./tracking.component.css']
})
export class TrackingComponent implements OnInit {

  tripId: string = '';

  // Trip Header Info
  tripHeader = {
    date: '15',
    month: 'Dez 2025',
    route: 'Berlin → Hamburg',
    driver: 'Thomas M.',
    vehicle: 'Transporter',
    trackingNr: '#TRK-2025-15789',
    pickup: '08:00 Uhr',
    estimatedArrival: '11:00 Uhr'
  };

  // Status Updates (Timeline)
  statusUpdates: StatusUpdate[] = [
    {
      status: 'abgeholt',
      title: '✓ Abgeholt',
      time: '15.12.2025, 08:15 Uhr',
      location: 'Ort: Berlin Mitte, Friedrichstraße 123',
      icon: '📦',
      color: '#10b981',
      current: false
    },
    {
      status: 'unterwegs',
      title: '🚚 Unterwegs',
      time: 'Aktualisiert: vor 5 Minuten',
      location: 'Aktuelle Position: A24, ca. 120 km von Hamburg entfernt',
      details: 'Geschätzte Ankunft: 11:15 Uhr (15 Min. Verspätung)',
      icon: '🚚',
      color: '#f59e0b',
      current: true
    },
    {
      status: 'zugestellt',
      title: 'Zugestellt',
      time: 'Ausstehend',
      location: 'Ziel: Hamburg Altona, Große Bergstraße 45',
      icon: '📍',
      color: '#9ca3af',
      current: false
    }
  ];

  // Current Position (for progress bar)
  currentPosition = {
    location: 'A24 bei Schwarzenbek',
    progress: 89,
    estimatedArrival: '15:45 Uhr',
    remainingDistance: '45 km',
    remainingTime: '35 Min'
  };

  // Delivery Details
  deliveryDetails = {
    pickup: {
      address: 'Friedrichstraße 123',
      city: '10117 Berlin Mitte',
      contact: 'Max Mustermann',
      phone: '+49 123 456789'
    },
    delivery: {
      address: 'Große Bergstraße 45',
      city: '22767 Hamburg Altona',
      contact: 'Anna Schmidt',
      phone: '+49 987 654321'
    }
  };

  // Cargo Info
  cargoInfo = {
    weight: '75 kg',
    dimensions: '180 x 120 x 80 cm',
    packages: '3',
    insurance: '✓ Vollkasko (bis 5.000 €)'
  };

  // Notifications
  notifications: Notification[] = [
    {
      time: 'vor 5 Minuten',
      message: 'Position aktualisiert: Fahrer ist auf der A24, ca. 120 km von Hamburg entfernt'
    },
    {
      time: 'vor 45 Minuten',
      message: 'Verzögerung: Voraussichtliche Ankunft verschiebt sich um 15 Minuten wegen Verkehr'
    },
    {
      time: 'heute, 08:15 Uhr',
      message: 'Transport begonnen: Fahrer hat die Ladung abgeholt'
    }
  ];

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.tripId = params['id'] || '1';
    });
  }

  onCallDriver(): void {
    alert('Fahrer anrufen: ' + this.tripHeader.driver);
  }

  onSendMessage(): void {
    alert('Nachricht an Fahrer senden');
  }

  onEnableNotifications(): void {
    alert('Benachrichtigungen wurden aktiviert!');
  }

  onShowDeliveryNote(): void {
    alert('Lieferschein anzeigen');
  }
}
