import { Injectable } from '@angular/core';

export interface TransportOffer {
  id: string;
  driverName: string;
  driverAvatar: string;
  driverRating: number;
  driverTrips: number;
  route: string;
  from: string;
  to: string;
  date: string;
  time: string;
  duration: string;
  distance: string;
  vehicleType: string;
  vehicleModel: string;
  maxWeight: number;
  dimensions: string;
  capacity: string;
  price: number;
  tags: string[];
  pickupLocation: string;
  dropoffLocation: string;
  description: string;
  verified: {
    id: boolean;
    license: boolean;
    phone: boolean;
  };
  memberSince: string;
  responseTime: string;
  reviews: Review[];
}

export interface Review {
  reviewerName: string;
  reviewerAvatar: string;
  rating: number;
  date: string;
  comment: string;
}

@Injectable({
  providedIn: 'root'
})
export class OfferService {

  private offers: TransportOffer[] = [
    // Januar 2026
    {
      id: '1',
      driverName: 'Thomas M.',
      driverAvatar: 'https://i.pravatar.cc/150?img=11',
      driverRating: 4.9,
      driverTrips: 67,
      route: 'Berlin → Hamburg',
      from: 'Berlin',
      to: 'Hamburg',
      date: '15.01.2026',
      time: '08:00',
      duration: 'ca. 3 Std.',
      distance: '290 km',
      vehicleType: 'Transporter',
      vehicleModel: 'Mercedes Sprinter',
      maxWeight: 100,
      dimensions: '200 x 150 x 120 cm',
      capacity: '12 m³',
      price: 65,
      tags: ['Versicherung inkl.', 'Be-/Entladehilfe'],
      pickupLocation: 'Berlin Mitte, 10115',
      dropoffLocation: 'Hamburg Altona, 22765',
      description: 'Hallo! Ich fahre regelmäßig zwischen Berlin und Hamburg und biete zuverlässigen Transport für Ihre Gegenstände an.\n\nMein Transporter hat viel Platz und ist perfekt für Möbel, Umzugskisten oder größere Gegenstände geeignet. Ich helfe gerne beim Be- und Entladen und behandle alle Sachen mit Sorgfalt.\n\nDie Versicherung ist bereits im Preis enthalten. Bei Fragen können Sie mich jederzeit kontaktieren.',
      verified: { id: true, license: true, phone: true },
      memberSince: 'Januar 2023',
      responseTime: 'Innerhalb 2 Stunden',
      reviews: [
        {
          reviewerName: 'Anna K.',
          reviewerAvatar: 'https://i.pravatar.cc/50?img=5',
          rating: 5,
          date: 'vor 2 Wochen',
          comment: 'Sehr zuverlässig und pünktlich! Hat beim Tragen geholfen und war sehr freundlich. Gerne wieder!'
        },
        {
          reviewerName: 'Peter M.',
          reviewerAvatar: 'https://i.pravatar.cc/50?img=12',
          rating: 5,
          date: 'vor 1 Monat',
          comment: 'Perfekter Transport! Alles ist heil angekommen. Kann ich nur weiterempfehlen.'
        },
        {
          reviewerName: 'Lisa S.',
          reviewerAvatar: 'https://i.pravatar.cc/50?img=9',
          rating: 4,
          date: 'vor 2 Monaten',
          comment: 'Alles gut gelaufen. Kleine Verspätung aber vorher Bescheid gegeben. Sonst top!'
        }
      ]
    },
    {
      id: '2',
      driverName: 'Sarah K.',
      driverAvatar: 'https://i.pravatar.cc/150?img=5',
      driverRating: 5.0,
      driverTrips: 143,
      route: 'München → Stuttgart',
      from: 'München',
      to: 'Stuttgart',
      date: '22.01.2026',
      time: '14:00',
      duration: 'ca. 2 Std.',
      distance: '230 km',
      vehicleType: 'PKW',
      vehicleModel: 'VW Passat Kombi',
      maxWeight: 50,
      dimensions: '120 x 80 x 60 cm',
      capacity: '1.8 m³',
      price: 45,
      tags: ['Express', 'Versicherung inkl.'],
      pickupLocation: 'München Zentrum, 80331',
      dropoffLocation: 'Stuttgart Mitte, 70173',
      description: 'Ich pendle regelmäßig zwischen München und Stuttgart und nehme gerne kleinere Sendungen mit. Mein Kombi bietet ausreichend Platz für Umzugskisten, kleinere Möbel oder Pakete.\n\nIch fahre sehr vorsichtig und achte darauf, dass alles sicher verstaut ist. Express-Lieferung am selben Tag möglich!',
      verified: { id: true, license: true, phone: true },
      memberSince: 'März 2022',
      responseTime: 'Innerhalb 1 Stunde',
      reviews: [
        {
          reviewerName: 'Michael T.',
          reviewerAvatar: 'https://i.pravatar.cc/50?img=13',
          rating: 5,
          date: 'vor 1 Woche',
          comment: 'Sehr professionell und pünktlich. Kann ich nur empfehlen!'
        },
        {
          reviewerName: 'Julia W.',
          reviewerAvatar: 'https://i.pravatar.cc/50?img=10',
          rating: 5,
          date: 'vor 3 Wochen',
          comment: 'Schnelle und sichere Lieferung. Danke!'
        }
      ]
    },
    // Februar 2026
    {
      id: '3',
      driverName: 'Michael R.',
      driverAvatar: 'https://i.pravatar.cc/150?img=13',
      driverRating: 4.7,
      driverTrips: 34,
      route: 'Köln → Frankfurt',
      from: 'Köln',
      to: 'Frankfurt',
      date: '10.02.2026',
      time: '10:00',
      duration: 'ca. 2 Std.',
      distance: '190 km',
      vehicleType: 'Transporter',
      vehicleModel: 'Ford Transit',
      maxWeight: 150,
      dimensions: '250 x 180 x 150 cm',
      capacity: '15 m³',
      price: 70,
      tags: ['Be-/Entladehilfe'],
      pickupLocation: 'Köln Innenstadt, 50667',
      dropoffLocation: 'Frankfurt am Main, 60311',
      description: 'Biete professionellen Transport zwischen Köln und Frankfurt. Mein Transporter ist ideal für größere Transporte. Ich helfe beim Be- und Entladen.\n\nHabe Erfahrung mit Möbeltransporten und gehe sehr sorgfältig mit den Gegenständen um.',
      verified: { id: true, license: true, phone: false },
      memberSince: 'Juni 2024',
      responseTime: 'Innerhalb 3 Stunden',
      reviews: [
        {
          reviewerName: 'Stefan B.',
          reviewerAvatar: 'https://i.pravatar.cc/50?img=33',
          rating: 5,
          date: 'vor 1 Monat',
          comment: 'Sehr zufrieden mit dem Service. Hat alles geklappt!'
        }
      ]
    },
    {
      id: '4',
      driverName: 'Klaus H.',
      driverAvatar: 'https://i.pravatar.cc/150?img=70',
      driverRating: 4.6,
      driverTrips: 25,
      route: 'Leipzig → Dresden',
      from: 'Leipzig',
      to: 'Dresden',
      date: '18.02.2026',
      time: '07:00',
      duration: 'ca. 1.5 Std.',
      distance: '120 km',
      vehicleType: 'PKW',
      vehicleModel: 'Audi A6 Avant',
      maxWeight: 18,
      dimensions: '85 x 60 x 45 cm',
      capacity: '1.5 m³',
      price: 38,
      tags: ['Express'],
      pickupLocation: 'Leipzig Zentrum, 04109',
      dropoffLocation: 'Dresden Altstadt, 01067',
      description: 'Schneller Express-Service zwischen Leipzig und Dresden. Perfekt für kleine Sendungen und Dokumente.',
      verified: { id: true, license: false, phone: true },
      memberSince: 'November 2024',
      responseTime: 'Innerhalb 4 Stunden',
      reviews: []
    }
  ];

  // User's own offers (stored separately in localStorage)
  private myOffers: TransportOffer[] = [];

  constructor() {
    // Load user's offers from localStorage
    this.loadMyOffers();
  }

  private loadMyOffers(): void {
    const saved = localStorage.getItem('mycargonaut_my_offers');
    if (saved) {
      this.myOffers = JSON.parse(saved);
      console.log('Loaded my offers:', this.myOffers.length);
    }
  }

  private saveMyOffers(): void {
    localStorage.setItem('mycargonaut_my_offers', JSON.stringify(this.myOffers));
    console.log('Saved my offers:', this.myOffers.length);
  }

  getAllOffers(): TransportOffer[] {
    // Combine default offers with user's offers
    return [...this.offers, ...this.myOffers];
  }

  getOfferById(id: string): TransportOffer | undefined {
    return this.getAllOffers().find(offer => offer.id === id);
  }

  // Get only user's own offers
  getMyOffers(): TransportOffer[] {
    return [...this.myOffers];
  }

  // Create a new offer
  createOffer(data: any, currentUser: any): TransportOffer {
    const newOffer: TransportOffer = {
      id: this.generateId(),
      driverName: currentUser?.name || 'Max Mustermann',
      driverAvatar: currentUser?.avatar || 'https://i.pravatar.cc/150?img=1',
      driverRating: currentUser?.rating || 5.0,
      driverTrips: currentUser?.trips || 0,
      route: `${data.from} → ${data.to}`,
      from: data.from,
      to: data.to,
      date: this.formatDate(data.date),
      time: data.time,
      duration: data.duration,
      distance: data.distance,
      vehicleType: data.vehicleType,
      vehicleModel: data.vehicleModel,
      maxWeight: data.maxWeight,
      dimensions: data.dimensions,
      capacity: data.capacity,
      price: data.price,
      tags: data.tags,
      pickupLocation: data.pickupLocation,
      dropoffLocation: data.dropoffLocation,
      description: data.description,
      verified: {
        id: currentUser?.verified?.id || true,
        license: currentUser?.verified?.license || true,
        phone: currentUser?.verified?.phone || true
      },
      memberSince: currentUser?.memberSince || 'Dezember 2024',
      responseTime: 'Innerhalb 2 Stunden',
      reviews: []
    };

    this.myOffers.push(newOffer);
    this.saveMyOffers();

    console.log('Created new offer:', newOffer);
    return newOffer;
  }

  // Delete an offer
  deleteOffer(offerId: string): boolean {
    const index = this.myOffers.findIndex(o => o.id === offerId);
    if (index > -1) {
      this.myOffers.splice(index, 1);
      this.saveMyOffers();
      return true;
    }
    return false;
  }

  // Helper: Generate unique ID
  private generateId(): string {
    return 'offer_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Helper: Format date to German format
  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  }
}
