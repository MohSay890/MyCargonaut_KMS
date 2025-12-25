import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-how-it-works',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './how-it-works.component.html',
  styleUrls: ['./how-it-works.component.css']
})
export class HowItWorksComponent {

  activeTab: 'sender' | 'driver' = 'sender';

  senderSteps = [
    {
      number: 1,
      title: 'Transport suchen',
      description: [
        'Gib Start- und Zielort ein',
        'Wähle das gewünschte Datum',
        'Filtere nach Fahrzeugtyp, Preis und Bewertungen',
        'Durchsuche passende Angebote von verifizierten Fahrern'
      ],
      tip: 'Je flexibler du beim Datum bist, desto mehr Optionen findest du!'
    },
    {
      number: 2,
      title: 'Fahrer auswählen & buchen',
      description: [
        'Vergleiche Profile, Bewertungen und Preise',
        'Prüfe die Fahrzeugdetails und Verfügbarkeit',
        'Stelle Fragen über die Nachrichtenfunktion',
        'Buche mit einem Klick – sichere Zahlung inklusive'
      ],
      tip: 'Alle Fahrer sind verifiziert und versichert!'
    },
    {
      number: 3,
      title: 'Transport verfolgen',
      description: [
        'Erhalte Bestätigung mit allen Details',
        'Verfolge deinen Transport in Echtzeit auf der Karte',
        'Bleibe per SMS/E-Mail über den Status informiert',
        'Kontaktiere den Fahrer jederzeit direkt'
      ],
      tip: 'Transportversicherung ist immer inklusive!'
    },
    {
      number: 4,
      title: 'Bewerten & fertig',
      description: [
        'Bestätige die erfolgreiche Zustellung',
        'Bewerte deine Erfahrung mit dem Fahrer',
        'Zahlung wird automatisch freigegeben',
        'Nutze die Plattform beim nächsten Mal wieder!'
      ],
      tip: 'Bewertungen helfen der Community, die besten Fahrer zu finden!'
    }
  ];

  driverSteps = [
    {
      number: 1,
      title: 'Registrieren & verifizieren',
      description: [
        'Erstelle dein Fahrerprofil mit Foto',
        'Verifiziere deinen Ausweis und Führerschein',
        'Füge dein(e) Fahrzeug(e) hinzu mit Fotos',
        'Gib deine bevorzugten Routen und Zeiten an'
      ],
      tip: 'Die Verifizierung dauert nur 24 Stunden!'
    },
    {
      number: 2,
      title: 'Fahrt anbieten',
      description: [
        'Erstelle Angebote für deine geplanten Fahrten',
        'Lege Preis, Kapazität und Bedingungen fest',
        'Erhalte automatisch Benachrichtigungen bei Anfragen',
        'Akzeptiere passende Buchungen mit einem Klick'
      ],
      tip: 'Du kannst Angebote auch für regelmäßige Fahrten erstellen!'
    },
    {
      number: 3,
      title: 'Transport durchführen',
      description: [
        'Hole die Ladung zum vereinbarten Zeitpunkt ab',
        'Transportiere sorgfältig zum Zielort',
        'Halte den Versender per App auf dem Laufenden',
        'Bestätige die Zustellung mit Foto/Unterschrift'
      ],
      tip: 'Du bist über die Plattform vollständig versichert!'
    },
    {
      number: 4,
      title: 'Geld verdienen',
      description: [
        'Erhalte deine Zahlung automatisch auf dein Konto',
        'Sammle positive Bewertungen für mehr Buchungen',
        'Verdiene zusätzliches Geld bei deinen regulären Fahrten',
        'Werde Teil unserer wachsenden Fahrer-Community!'
      ],
      tip: 'Keine versteckten Gebühren – nur 15% Provision!'
    }
  ];

  senderFaqs = [
    {
      question: 'Wie sicher ist der Transport?',
      answer: 'Alle Transporte sind automatisch versichert. Zusätzlich sind alle Fahrer verifiziert.'
    },
    {
      question: 'Wann bezahle ich?',
      answer: 'Die Zahlung erfolgt bei Buchung. Das Geld wird erst nach erfolgreicher Zustellung freigegeben.'
    },
    {
      question: 'Was wenn etwas schief geht?',
      answer: 'Unser Support-Team hilft dir 24/7. Bei Schäden greift die Transportversicherung.'
    },
    {
      question: 'Kann ich den Fahrer bewerten?',
      answer: 'Ja! Nach jedem Transport kannst du eine Bewertung abgeben.'
    }
  ];

  driverFaqs = [
    {
      question: 'Wie viel kann ich verdienen?',
      answer: 'Das hängt von Route, Fahrzeug und Häufigkeit ab. Viele Fahrer verdienen 200-500€ extra pro Monat.'
    },
    {
      question: 'Welche Gebühren fallen an?',
      answer: 'Wir behalten 15% Provision ein. Keine weiteren versteckten Kosten.'
    },
    {
      question: 'Bin ich versichert?',
      answer: 'Ja! Alle Transporte sind über uns vollständig versichert – ohne Zusatzkosten für dich.'
    },
    {
      question: 'Muss ich alle Anfragen annehmen?',
      answer: 'Nein! Du entscheidest frei, welche Transporte du durchführen möchtest.'
    }
  ];

  constructor(private router: Router) {}

  onSearchTransport(): void {
    this.router.navigate(['/search']);
  }

  onRegisterDriver(): void {
    this.router.navigate(['/registration']);
  }
}
