import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

@Component({
  selector: 'app-how-it-works',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './how-it-works.component.html',
  styleUrls: ['./how-it-works.component.css'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('400ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('listItem', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ])
    ]),
    trigger('expandCollapse', [
      transition(':enter', [
        style({ height: 0, opacity: 0 }),
        animate('300ms ease-out', style({ height: '*', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ height: 0, opacity: 0 }))
      ])
    ])
  ]
})
export class HowItWorksComponent implements OnInit, OnDestroy {

  activeTab: 'sender' | 'driver' = 'sender';
  currentStep = 1;
  totalSteps = 4;

  // Demo animations
  demoTyping: string | null = null;
  demoFromCity = '';
  demoToCity = '';
  demoDate = '15. Jan 2025';
  searchReady = false;

  // Offer selection
  selectedOffer: number | null = null;
  highlightOffer: number | null = null;
  demoOffers = [
    { avatar: '👨', name: 'Max M.', rating: '4.9', route: 'Berlin → München', price: 85 },
    { avatar: '👩', name: 'Anna K.', rating: '4.8', route: 'Berlin → München', price: 75 },
    { avatar: '👨‍🦱', name: 'Tom S.', rating: '5.0', route: 'Berlin → München', price: 95 }
  ];

  // Tracking demo
  truckPosition = 10;
  private truckInterval: any;

  // Review demo
  demoRating = 0;
  showSuccessAnimation = false;

  // Driver demo
  profileUploaded = false;
  verifySteps = { id: false, license: false, vehicle: false };
  verifyProgress = 0;
  demoPrice = 85;
  showNotification = false;
  deliverySteps = { pickup: false, transit: false, delivered: false };

  // Earnings
  displayedEarnings = 0;
  countingMoney = false;

  // Stats animation
  animateStats = false;
  animatedUsers = 0;
  animatedTransports = 0;
  animatedCities = 0;

  // FAQ
  openFaq: number | null = null;
  faqs = [
    { question: 'Wie sicher ist der Transport?', answer: 'Alle Transporte sind automatisch versichert. Zusätzlich sind alle Fahrer verifiziert und geprüft. Bei Schäden greift unsere umfassende Transportversicherung.' },
    { question: 'Was kostet die Nutzung?', answer: 'Die Registrierung ist kostenlos! Für Versender fallen nur die Transportkosten an. Fahrer zahlen eine faire Provision von 15% pro erfolgreichem Transport.' },
    { question: 'Wie schnell erhalte ich mein Geld?', answer: 'Fahrer erhalten ihre Auszahlung innerhalb von 1-2 Werktagen nach erfolgreicher Zustellung direkt auf ihr Bankkonto.' },
    { question: 'Kann ich Transporte stornieren?', answer: 'Ja, Stornierungen sind bis 24 Stunden vor dem vereinbarten Termin kostenlos möglich. Bei späteren Stornierungen können Gebühren anfallen.' },
    { question: 'Welche Fahrzeuge sind erlaubt?', answer: 'Von PKW über Transporter bis zum LKW – alle Fahrzeugtypen sind willkommen. Wichtig ist nur ein gültiger Führerschein und eine aktuelle Versicherung.' }
  ];

  // Step data
  senderSteps = [
    {
      shortTitle: 'Suchen',
      title: 'Transport suchen',
      features: [
        'Start- und Zielort eingeben',
        'Datum und Uhrzeit wählen',
        'Nach Fahrzeugtyp und Preis filtern',
        'Verifizierte Fahrer finden'
      ],
      tip: 'Je flexibler du beim Datum bist, desto mehr Optionen findest du!'
    },
    {
      shortTitle: 'Buchen',
      title: 'Fahrer auswählen & buchen',
      features: [
        'Profile und Bewertungen vergleichen',
        'Fahrzeugdetails prüfen',
        'Direkt mit Fahrer chatten',
        'Sichere Online-Zahlung'
      ],
      tip: 'Alle Fahrer sind verifiziert und versichert!'
    },
    {
      shortTitle: 'Verfolgen',
      title: 'Transport live verfolgen',
      features: [
        'Echtzeit-Tracking auf der Karte',
        'Status-Updates per Push & SMS',
        'Direkter Kontakt zum Fahrer',
        'Geschätzte Ankunftszeit'
      ],
      tip: 'Transportversicherung ist immer inklusive!'
    },
    {
      shortTitle: 'Bewerten',
      title: 'Bewerten & abschließen',
      features: [
        'Zustellung bestätigen',
        'Fahrer bewerten',
        'Zahlung wird freigegeben',
        'Transaktionshistorie einsehen'
      ],
      tip: 'Bewertungen helfen der Community!'
    }
  ];

  driverSteps = [
    {
      shortTitle: 'Registrieren',
      title: 'Registrieren & verifizieren',
      features: [
        'Profil mit Foto erstellen',
        'Ausweis & Führerschein hochladen',
        'Fahrzeug(e) hinzufügen',
        'Schnelle Verifizierung in 24h'
      ],
      tip: 'Die Verifizierung dauert nur 24 Stunden!'
    },
    {
      shortTitle: 'Anbieten',
      title: 'Fahrten anbieten',
      features: [
        'Eigene Route festlegen',
        'Preis selbst bestimmen',
        'Kapazität angeben',
        'Regelmäßige Fahrten planen'
      ],
      tip: 'Du kannst Angebote auch für regelmäßige Fahrten erstellen!'
    },
    {
      shortTitle: 'Transportieren',
      title: 'Transport durchführen',
      features: [
        'Buchungsanfragen annehmen',
        'Abholung & Zustellung bestätigen',
        'Versender informieren',
        'Zustellung mit Foto dokumentieren'
      ],
      tip: 'Du bist über die Plattform vollständig versichert!'
    },
    {
      shortTitle: 'Verdienen',
      title: 'Geld verdienen',
      features: [
        'Automatische Auszahlung',
        'Transparente Abrechnung',
        'Nur 15% Provision',
        'Bewertungen sammeln'
      ],
      tip: 'Keine versteckten Gebühren!'
    }
  ];

  private animationIntervals: any[] = [];

  ngOnInit(): void {
    // Start stats animation after a delay
    setTimeout(() => {
      this.animateStats = true;
      this.animateNumbers();
    }, 500);
  }

  ngOnDestroy(): void {
    this.animationIntervals.forEach(interval => clearInterval(interval));
    if (this.truckInterval) clearInterval(this.truckInterval);
  }

  selectRole(role: 'sender' | 'driver'): void {
    this.activeTab = role;
    this.currentStep = 1;
    this.resetDemoState();
  }

  getCurrentSteps() {
    return this.activeTab === 'sender' ? this.senderSteps : this.driverSteps;
  }

  getCurrentStepData() {
    const steps = this.getCurrentSteps();
    return steps[this.currentStep - 1];
  }

  goToStep(step: number): void {
    this.currentStep = step;
    this.runStepAnimation();
  }

  nextStep(): void {
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
      this.runStepAnimation();
    }
  }

  prevStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.runStepAnimation();
    }
  }

  startDemo(): void {
    this.currentStep = 1;
    this.runStepAnimation();
    // Scroll to demo section
    document.querySelector('.demo-section')?.scrollIntoView({ behavior: 'smooth' });
  }

  finishDemo(): void {
    // Navigate to registration or show completion message
    this.router.navigate(['/register']);
  }

  private resetDemoState(): void {
    this.demoFromCity = '';
    this.demoToCity = '';
    this.searchReady = false;
    this.selectedOffer = null;
    this.truckPosition = 10;
    this.demoRating = 0;
    this.showSuccessAnimation = false;
    this.profileUploaded = false;
    this.verifySteps = { id: false, license: false, vehicle: false };
    this.verifyProgress = 0;
    this.deliverySteps = { pickup: false, transit: false, delivered: false };
    this.displayedEarnings = 0;
  }

  private runStepAnimation(): void {
    this.animationIntervals.forEach(interval => clearInterval(interval));
    if (this.truckInterval) clearInterval(this.truckInterval);

    if (this.activeTab === 'sender') {
      this.runSenderAnimation();
    } else {
      this.runDriverAnimation();
    }
  }

  private runSenderAnimation(): void {
    switch (this.currentStep) {
      case 1:
        this.runSearchAnimation();
        break;
      case 2:
        this.runSelectAnimation();
        break;
      case 3:
        this.runTrackingAnimation();
        break;
      case 4:
        this.runReviewAnimation();
        break;
    }
  }

  private runDriverAnimation(): void {
    switch (this.currentStep) {
      case 1:
        this.runVerifyAnimation();
        break;
      case 2:
        // Offer creation - no special animation
        break;
      case 3:
        this.runDeliveryAnimation();
        break;
      case 4:
        this.runEarningsAnimation();
        break;
    }
  }

  private runSearchAnimation(): void {
    this.demoFromCity = '';
    this.demoToCity = '';
    this.searchReady = false;

    const fromCity = 'Berlin';
    const toCity = 'München';
    let fromIndex = 0;
    let toIndex = 0;

    this.demoTyping = 'from';

    const fromInterval = setInterval(() => {
      if (fromIndex < fromCity.length) {
        this.demoFromCity += fromCity[fromIndex];
        fromIndex++;
      } else {
        clearInterval(fromInterval);
        this.demoTyping = 'to';

        const toInterval = setInterval(() => {
          if (toIndex < toCity.length) {
            this.demoToCity += toCity[toIndex];
            toIndex++;
          } else {
            clearInterval(toInterval);
            this.demoTyping = null;
            this.searchReady = true;
          }
        }, 100);
        this.animationIntervals.push(toInterval);
      }
    }, 100);
    this.animationIntervals.push(fromInterval);
  }

  private runSelectAnimation(): void {
    this.selectedOffer = null;
    this.highlightOffer = null;

    let current = 0;
    const highlightInterval = setInterval(() => {
      this.highlightOffer = current;
      current++;
      if (current >= this.demoOffers.length) {
        clearInterval(highlightInterval);
        setTimeout(() => {
          this.highlightOffer = null;
          this.selectedOffer = 0;
        }, 500);
      }
    }, 600);
    this.animationIntervals.push(highlightInterval);
  }

  private runTrackingAnimation(): void {
    this.truckPosition = 10;

    this.truckInterval = setInterval(() => {
      if (this.truckPosition < 85) {
        this.truckPosition += 1;
      } else {
        this.truckPosition = 10;
      }
    }, 100);
  }

  private runReviewAnimation(): void {
    this.showSuccessAnimation = false;
    this.demoRating = 0;

    setTimeout(() => {
      this.showSuccessAnimation = true;
    }, 300);

    setTimeout(() => {
      let rating = 0;
      const ratingInterval = setInterval(() => {
        if (rating < 5) {
          rating++;
          this.demoRating = rating;
        } else {
          clearInterval(ratingInterval);
        }
      }, 200);
      this.animationIntervals.push(ratingInterval);
    }, 1000);
  }

  private runVerifyAnimation(): void {
    this.profileUploaded = false;
    this.verifySteps = { id: false, license: false, vehicle: false };
    this.verifyProgress = 0;

    setTimeout(() => this.profileUploaded = true, 500);
    setTimeout(() => { this.verifySteps.id = true; this.verifyProgress = 33; }, 1000);
    setTimeout(() => { this.verifySteps.license = true; this.verifyProgress = 66; }, 1500);
    setTimeout(() => { this.verifySteps.vehicle = true; this.verifyProgress = 100; }, 2000);
  }

  private runDeliveryAnimation(): void {
    this.showNotification = false;
    this.deliverySteps = { pickup: false, transit: false, delivered: false };

    setTimeout(() => this.showNotification = true, 300);
    setTimeout(() => this.deliverySteps.pickup = true, 1500);
    setTimeout(() => this.deliverySteps.transit = true, 2500);
    setTimeout(() => this.deliverySteps.delivered = true, 3500);
  }

  private runEarningsAnimation(): void {
    this.displayedEarnings = 0;
    this.countingMoney = true;

    const target = 72.25;
    const duration = 1500;
    const steps = 30;
    const increment = target / steps;
    let current = 0;

    const countInterval = setInterval(() => {
      current += increment;
      if (current >= target) {
        this.displayedEarnings = target;
        this.countingMoney = false;
        clearInterval(countInterval);
      } else {
        this.displayedEarnings = Math.round(current * 100) / 100;
      }
    }, duration / steps);
    this.animationIntervals.push(countInterval);
  }

  selectOffer(index: number): void {
    this.selectedOffer = index;
  }

  setRating(rating: number): void {
    this.demoRating = rating;
  }

  updateDemoPrice(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.demoPrice = +target.value;
  }

  toggleFaq(index: number): void {
    this.openFaq = this.openFaq === index ? null : index;
  }

  private animateNumbers(): void {
    this.animateNumber('users', 10000, (val) => this.animatedUsers = val);
    this.animateNumber('transports', 25000, (val) => this.animatedTransports = val);
    this.animateNumber('cities', 500, (val) => this.animatedCities = val);
  }

  private animateNumber(type: string, target: number, setter: (val: number) => void): void {
    const duration = 2000;
    const steps = 50;
    const increment = target / steps;
    let current = 0;

    const interval = setInterval(() => {
      current += increment;
      if (current >= target) {
        setter(target);
        clearInterval(interval);
      } else {
        setter(Math.round(current));
      }
    }, duration / steps);
    this.animationIntervals.push(interval);
  }

  constructor(private router: Router) {}
}
