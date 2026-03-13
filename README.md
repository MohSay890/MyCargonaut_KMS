# MyCargonaut

MyCargonaut - Eine Plattform zum Teilen von Transportkapazitäten. Nutzer können Transportdienste für Güter und Fracht anbieten oder anfragen. Eine Full-Stack-Anwendung mit Spring Boot Backend und Angular Frontend.

## 📖 Übersicht
MyCargonaut verbindet Fahrer, die noch ungenutzten Platz in ihrem Fahrzeug haben, mit Personen, die etwas von A nach B transportieren lassen möchten. So schonen wir nicht nur die Umwelt durch weniger Leerfahrten, sondern ermöglichen es Nutzern auch, sich Transportkosten zu teilen. 

Egal ob es der Umzugskarton für den Studenten, das gekaufte eBay-Fahrrad oder eine Mitfahrgelegenheit ist: Auf MyCargonaut kann jeder sowohl **Angebote (Offers)** erstellen als auch **Anfragen (Requests)** aufgeben. Alles geschützt durch ein modernes Treuhand-Zahlungssystem (Escrow) und Live-GPS-Tracking.

## 🎯 Key Features
- **Rollenflexibilität:** Jeder Nutzer kann gleichzeitig Fahrer (Anbieter) und Versender (Anfrager) sein.
- **Fahrtangebote (Offers):** Fahrer stellen Routen mit freiem Platzangebot ein. Kapazitäten nach Gewicht/Maßen werden abgeglichen.
- **Transportanfragen (Requests):** Versender inserieren ihren Transportbedarf. Fahrer können daraufhin direkte Preisangebote machen.
- **Integriertes Bezahlsystem (Escrow):** Zahlungen werden von der Plattform treuhänderisch verwahrt. Erst bei erfolgreicher Zustellung erhält der Fahrer sein Geld (abzüglich 15% Plattformgebühr).
- **Live-Tracking (GPS):** Echtzeit-Standortverfolgung über WebSockets. Versender sehen während der Fahrt genau, wo sich ihr Transportgut befindet.
- **Gegenseitige Bewertungen:** Nach Abschluss der Fahrt können sich Nutzer und Fahrer mit Sternen (1-5) und Kommentaren bewerten.

---

## 🏗️ Technical Architecture

### Frontend Stack
- **Framework:** Angular 19 (Standalone Components)
- **Sprache:** TypeScript
- **Design/Styling:** HTML5/CSS3 (mit modernem CSS Grid/Flexbox)
- **Karten & Tracking:** Leaflet.js
- **Kommunikation:** RxJS, HttpClient, STOMP (WebSockets für Live-Tracking)

### Backend Stack
- **Framework:** Spring Boot 3.2.0
- **Sprache:** Java 21 (LTS)
- **Sicherheit:** Spring Security, JWT (JSON Web Tokens)
- **Datenbank:** PostgreSQL 15
- **Schnittstellen:** RESTful APIs, WebSocket (STOMP-Endpunkte)
- **Build Tool:** Maven 3.9+

### Development Tools
- **Containerisierung:** Docker & Docker Compose
- **Versionskontrolle:** Git & GitHub
- **IDE:** Visual Studio Code / IntelliJ IDEA

---

## 📱 App Struktur

```text
MyCargonaut_KMS/
│
├── .github/
│   └── workflows/          # CI/CD Pipeline (Java 21 + Angular Tests)
├── BACKEND/                # Spring Boot 3.2.0 (Java 21)
│   ├── src/main/java/      # Controller, Services, Repositories, Models
│   ├── src/test/           # Backend Unit & Integration Tests
│   └── pom.xml             # Maven Dependencies
│   
├── FRONTEND/               # Angular 19 (Node.js 18+)
│   ├── src/app/            # Angular Components, Services, Guards
│   ├── e2e/                # End-to-end Tests (Playwright)
│   └── package.json        # NPM Dependencies
│   
├── DESIGN/                 # UI/UX Design Assets
│   ├── mockups/            # HTML/CSS Mockups
│   └── wireframes/         # High-Fidelity Wireframes
│
├── UML_Diagrams/           # Systemarchitektur & Klassendiagramme
├── docker-compose.yml      # PostgreSQL Datenbank-Setup
└── README.md               # Diese Datei
```

---

## 🗄️ Datenbank Schema
Unsere relationale Datenbank (PostgreSQL) beinhaltet unter anderem die folgenden Haupttabellen:

#### `cargonaut`
```sql
- id (BIGINT, Primary Key)
- email (VARCHAR) - E-Mail Adresse des Nutzers
- passwort (VARCHAR) - Verschlüsseltes Passwort (BCrypt)
- vorname (VARCHAR) - Vorname
- nachname (VARCHAR) - Nachname 
- geburtsdatum (DATE) - Geburtsdatum
- handynummer (VARCHAR) - Telefonnummer
- stadt (VARCHAR) - Wohnort
- plz (VARCHAR) - Postleitzahl
- bio (TEXT) - Profilbeschreibung
- profilbild (TEXT) - URL/Pfad zum Profilbild
- registriert (DATE) - Registrierungsdatum
- ausweis_verifiziert (BOOLEAN) - Status der Identitätsprüfung
- fuehrerschein_verifiziert (BOOLEAN) - Status der Führerscheinprüfung
```

#### `fahrzeug`
```sql
- id (BIGINT, Primary Key)
- marke (VARCHAR) - Fahrzeugmarke
- modell (VARCHAR) - Modellname
- typ (VARCHAR) - Art des Fahrzeugs (z.B. Transporter, PKW)
- baujahr (INTEGER) - Baujahr 
- kennzeichen (VARCHAR) - Nummernschild
- kapazitaet (DOUBLE PRECISION) - Ladevolumen in m³
- max_gewicht (DOUBLE PRECISION) - Maximales Zuladungsgewicht in kg
- abmessungen (VARCHAR) - Dimensionen der Ladefläche
- hat_kuehlung (BOOLEAN) - Kühlfunktion vorhanden
- ist_aktiv (BOOLEAN) - Steht für Fahrten zur Verfügung
- besitzer_id (BIGINT, Foreign Key) - Verweis auf Cargonaut
```

#### `fahrt` (Angebote / Generierte Fahrten)
```sql
- id (BIGINT, Primary Key)
- start_ort (VARCHAR) - Startadresse/Stadt
- ziel_ort (VARCHAR) - Zieladresse/Stadt 
- datum (DATE) - Abfahrtsdatum
- uhrzeit (VARCHAR) - Geplante Uhrzeit
- preis (NUMERIC) - Preis der Fahrt
- freie_plaetze (INTEGER) - Verfügbare Kapazität (Plätze/Gewicht)
- status (VARCHAR) - Zustand (PENDING, BOOKED, ACTIVE, COMPLETED)
- fahrer_id (BIGINT, Foreign Key) - Anbieter der Fahrt
- fahrzeug_id (BIGINT, Foreign Key) - Genutztes Fahrzeug
- beschreibung (TEXT) - Optionale Routeninfos
```

#### `buchung`
```sql
- id (BIGINT, Primary Key)
- fahrt_id (BIGINT, Foreign Key) - Referenz zur Fahrt
- mitfahrer_id (BIGINT, Foreign Key) - Referenz zum anfragenden Nutzer
- status (VARCHAR) - Buchungszustand (PENDING, CONFIRMED, CANCELLED)
- anzahl_plaetze (INTEGER) - Anzahl reservierter Plätze
- is_paid (BOOLEAN) - Zahlungsstatus 
- payment_required (BOOLEAN) - Ist eine Escrow-Zahlung nötig?
- gebucht_am (TIMESTAMP) - Erstelldatum der Buchung
```

#### `payments` (Escrow-Transaktionen)
```sql
- id (BIGINT, Primary Key)
- fahrt_id (BIGINT, Foreign Key) - Zugehörige Fahrt
- payer_id (BIGINT, Foreign Key) - Zahlender Nutzer
- recipient_id (BIGINT, Foreign Key) - Empfangender Fahrer
- amount (NUMERIC) - Bruttobetrag
- platform_fee (NUMERIC) - 15% Systemgebühr
- recipient_amount (NUMERIC) - Nettobetrag für den Fahrer
- status (VARCHAR) - PENDING, PROCESSING, COMPLETED
- escrow_status (VARCHAR) - HELD (verwahrt), RELEASED (ausgezahlt), REFUNDED (erstattet)
- transaction_reference (VARCHAR) - Interne Belegnummer
```

#### `payouts`
```sql
- id (BIGINT, Primary Key)
- payment_id (BIGINT, Foreign Key) - Ursprüngliche Zahlung
- driver_id (BIGINT, Foreign Key) - Ausgezahler Fahrer
- amount (NUMERIC) - Auszahlungsbetrag
- status (VARCHAR) - Zustand der Banküberweisung
- scheduled_at (TIMESTAMP) - Geplanter Transfer
```

#### `bewertung`
```sql
- id (BIGINT, Primary Key)
- sterne (INTEGER) - Sterne von 1 bis 5
- kommentar (VARCHAR) - Textuelle Begründung
- autor_id (BIGINT, Foreign Key) - Verfasser
- bewerteter_nutzer_id (BIGINT, Foreign Key) - Empfänger
- fahrt_id (BIGINT, Foreign Key) - Zugehöriger Trip
- ist_puenktlich (BOOLEAN) - Pünktlichkeits-Tag
- abmachungen_eingehalten (BOOLEAN) - Zuverlässigkeits-Tag
````

## 🚀 Quick Start

### Voraussetzungen
- **Java 21** (LTS)
- **Node.js 18+** & npm
- **Docker** & Docker Compose
- **Maven 3.9+**

### Lokales Setup

Öffne **3 separate Terminals** in deinem Projekt-Stammverzeichnis:

#### Terminal 1: Datenbank (Docker)
```bash
docker-compose up -d
# Überprüfe den Status:
docker ps
```
*Die Postgre-Datenbank läuft nun auf Port 5433.*

#### Terminal 2: Backend (Spring Boot)
```bash
cd BACKEND
mvn clean install
mvn spring-boot:run
```
*Das Backend startet auf http://localhost:8080. (Check: http://localhost:8080/api/health)*

#### Terminal 3: Frontend (Angular)
```bash
cd FRONTEND
npm install
npm start
```
*Das Frontend startet auf http://localhost:4200. Öffne diese URL in deinem Browser.*

---

## 🧪 Testing

Wir legen großen Wert auf eine robuste Testabdeckung, sowohl im Backend, als auch im Frontend und der kritischen User-Journeys (z.B. dem Bezahl- und Trackingsystem).

### Unit Tests
- **Backend:** JUnit 5 und Mockito. Testet Controller API-Responses, Service-Logik (z.B. Escrow-Gebührenberechnung) und sichert ab, dass JWT-Tokens richtig validiert werden. Ausführbar über `mvn test`.

- **Frontend:** Jasmine/Karma. Testet die Angular Komponenten, Routing-Guards und Service-Mocks. Ausführbar über `npm test`.

### E2E Tests (End-to-End)
- **Framework:** Playwright

- Testet komplette "Happy Paths" vom Einloggen über das Buchen bis zur Bezahlung und Live-Tracking-Simulation auf der Leaflet Karte.

- Ausführbar im Ordner `/FRONTEND/` mit: `npx playwright test` 

> 💡 **Für ausführliche Details zu unseren Testabläufen und -skripten lies bitte unseren separaten [TESTING_GUIDE.md](./TESTING_GUIDE.md).** Hier wird genau erklärt, wie du Tests schreibst und unsere Skripte wie `one-click-e2e.ps1` nutzt.

---

## 🎨 UI/UX Features
- **Responsive Design:** Die App skaliert reibungslos auf Desktop, Tablet und mobilen Geräten.
- **Interaktive Karten:** Integration von Leaflet-basierten interaktiven Karten zur Verfolgung.
- **Klarer Bezahl-Flow (Modals):** Eine nahtlose Modal-Checkout-Erfahrung für Escrow.
- **Status Badges:** Transparente farblich gekennzeichnete Tags für Fahrtzustände (Pending, Booked, Active, Completed).

---

## 🔒 Security & Privacy
- **Authentifizierung:** Secure Token-basiertes System (JWT) bei jedem API-Request.

- **Autorisierung:** Backend-Checks stellen sicher, dass bspw. Benutzer nur ihre *eigenen* Fahrten bearbeiten oder Escrows freigeben lassen können.

- **Escrow-Zahlungen:** Echtes Geld wird niemals sofort weitergeleitet; das "Treuhandsystem" hindert Betrug auf der Plattform, da Auszahlungen an das Beenden der echten GPS-Fahrt gekoppelt sind.

- **Passwortsicherheit:** Gesalzene Hashes über BCrypt vor dem Speichern in der DB.

---

## 🤝 Contributing

Wir freuen uns über jede Mitwirkung! So kannst du dazu beitragen:

### Development Workflow
1. Erstelle einen Branch für dein Feature (z.B. `feature/neues-tracking`).

2. Entwickle das Feature und schreibe dazu immer die passenden Unit- und ggf. Playwright E2E-Tests.

3. Führe lokal die Tests aus (`mvn test` und `npm run build`), um sicherzustellen, dass keine Fehler eingebaut wurden.

4. Committe mit klaren, verständlichen Commit-Messages.

5. Pushe den Branch zu GitHub und stelle einen **Pull Request**
    - Beschreibe im PR-Text genau, was dein Feature macht, welche Änderungen du vorgenommen hast und welche Tests du hinzugefügt hast.

6. Ein anderes Teammitglied sollte den **Pull Request** überprüfen. Achte dabei besonders auf:
   - Funktionalität: Erfüllt der Code die Anforderungen des Features?
   - Code-Qualität: Ist der Code sauber, modular und wartbar?
   - Pipelines: Werden alle Tests erfolgreich ausgeführt? Gibt es neue Tests für das Feature?
   - Tests: Sind ausreichend Tests vorhanden und erfolgreich?


7. Nach erfolgreicher Code-Review und Merge wird das Feature in die nächste Version integriert.

### Code Standards
- **Java:** Halte dich an gängige Java/Spring-Standards (z.B. sprechende Namen, Kapselung, dependency injection).

- **Angular:** Nutze Standalone-Components. Schreibe `*ngIf` Logik sauber und modularisiere große Templates in wiederverwendbare, kleinere UI-Komponenten ab.

- Kommentiere komplexe Teile der Geschäftslogik (insbesondere in Zahlungs- und Tracking-Services).

---

## 📄 License
**MIT**

---

## 👥 Team
Entwickelt als Projekt für KMS (Praktikum Konzepte moderner Softwareentwicklung) im Wintersemester 25/26 an der THM von:
- Mohamed Elsayed 
- Ismail Messaoudi
- Cansel Cakar

---

## 🔄 Changelog
- **v1.2.0:** Escrow-System vollständig integriert. Automatische Fahrer-Auszahlungen abzüglich 15% Provision realisiert. Fehler bei mehrfachen Bewertungen behoben.

- **v1.1.0:** WebSocketbasiertes GPS-Tracking per PIN-Code für laufende Fahrten eingeführt.

- **v1.0.0:** Initiales Release mit Suchfunktion, Anmeldung, Angebote und Buchungsanfragen.
