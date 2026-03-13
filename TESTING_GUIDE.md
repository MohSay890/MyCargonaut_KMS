# MyCargonaut - Testing Guide

Willkommen zur Testing-Dokumentation für MyCargonaut! Dieses Dokument beschreibt unsere Strategien, verwendeten Frameworks und wie du Tests erfolgreich ausführen oder neue hinzufügen kannst.

## 📊 Aktuelle Test Status & Distribution

Aktuell haben wir über das gesamte System hinweg automatisierte Tests implementiert:
- **Backend (Spring Boot):** ~71 Unit/Integration Tests über 6 Test-Klassen. 
- **Frontend (Angular):** ~51 Component/Service Tests über 8 Spec-Dateien. *(2 bekannte Mocking-Fehler im PaymentModal)*
- **End-to-End (E2E):** 6 Playwright UI Test-Suiten.

## 🗂️ Test Struktur

Das Projekt unterteilt sich in drei wesentliche Test-Bereiche:

```text
MyCargonaut_KMS/
├── BACKEND/
│   └── src/test/java/.../backend/
│       ├── controller/     # API Endpunkt & Auth Tests
│       ├── service/        # Geschäftslogik (Payment, Tracking) Tests
│       └── security/       # JWT & CORS Policy Tests
├── FRONTEND/
│   ├── src/app/            # Neben jeder .ts Datei liegt eine .spec.ts (Unit Tests)
│   └── e2e/                # Playwright E2E UI Tests
```

---

## 🛠️ Tech Stack

Wir setzen auf einen standardisierten, branchenüblichen Stack:

**Backend:**
- **JUnit 5 / Jupiter:** Kern-Framework für Teststruktur.
- **Mockito:** Mocking von Repositories und Services (Vermeidet DB-Aufrufe in Unit-Tests).
- **MockMvc:** Testet Spring Rest Controller und HTTP-Responses ohne den Tomcat Server voll hochfahren zu müssen.

**Frontend:**
- **Jasmine:** Behaviour-driven development (BDD) Test-Framework.
- **Karma:** Test-Runner zur Ausführung im Browser (z.B. ChromeHeadless).
- **Angular TestBed:** Zur Instanziierung und Mocking von Angular Standalone Components.

**E2E:**
- **Playwright:** Browser-Automatisierungstool (simuliert Klicks, Logins, Drag&Drop) inklusive Test-Isolierung.

---

## 🚀 Running Tests
Hier erfährst du, wie du alle Testebenen ausführst. Öffne das Terminal in den entsprechenden Ordnern:

### 1. Backend Tests (Spring Boot)
Navigiere in den Backend-Ordner und führe Maven aus:
```bash
cd BACKEND
# Führt alle Tests aus
mvn test

# Alternativ nur eine spezifische Testklasse:
mvn test -Dtest=PaymentServiceTest
```

### 2. Frontend Tests (Angular Unit Tests)
Navigiere in den Frontend-Ordner:
```bash
cd FRONTEND
# Führt Tests aus (ohne Browser UI, perfekt für CI/CD)
npm run test -- --watch=false --browsers=ChromeHeadless
```

### 3. End-to-End Tests (Playwright)
Damit E2E Tests funktionieren, **müssen Backend und Frontend auf Localhost laufen!**
```bash
cd FRONTEND
# Alle E2E-Szenarien ausführen
npx playwright test

# Mit UI (Browser-Sichtbarkeit) ausführen
npx playwright test --ui
```
*Tipp:* Alternativ kannst du im Root-Verzeichnis das von uns bereitgestellte PowerShell-Skript `./one-click-e2e.ps1` ausführen.

---

## ⚙️ Configuration

- **Playwright Config:** Ist definiert in `FRONTEND/playwright.config.ts`. Dort ist die `baseURL` auf `http://localhost:4200` gebunden.
- **Karma Config:** Standard `karma.conf.js` ist versteckt durch Angular CLI, aber Headless Mode ist für GitHub Actions konfiguriert.
- **Maven Surefire:** Definiert in `backend/pom.xml`. Lädt automatisch das `application-test.properties` Profil (In-Memory H2 / isolierte Postgres Config empfohen).

---

## 📝 Test Patterns & Beispiele

### Beispiel 1: Backend Service Unit Test (Mockito)
*Prüft isoliert die Geschäftslogik, ob z.B. Gebühren richtig berechnet werden.*
```java
@Test
void processPayment_ShouldDeductFee() {
    // Arrange
    Payment payment = new Payment();
    payment.setAmount(BigDecimal.valueOf(100.0));
    when(paymentRepository.findById(1L)).thenReturn(Optional.of(payment));

    // Act
    Payment processed = paymentService.processPayment(1L);

    // Assert
    assertEquals(BigDecimal.valueOf(15.0), processed.getPlatformFee()); // 15%
    assertEquals(BigDecimal.valueOf(85.0), processed.getRecipientAmount());
}
```

### Beispiel 2: Frontend Component Test (Angular TestBed)
*Prüft, ob UI-Elemente korrekt rendern.*
```typescript
it('should render the "Jetzt Buchen" button for external offers', () => {
    component.isOwnOffer = false;
    fixture.detectChanges();
    
    const button = fixture.debugElement.query(By.css('.btn-book'));
    expect(button).toBeTruthy();
    expect(button.nativeElement.textContent).toContain('Jetzt Buchen');
});
```

### Beispiel 3: E2E Playwright Test
*Simuliert den kompletten Flow eines Zahlungsprozesses im Browser.*
```typescript
test('should complete the escrow payment', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@user.de');
    await page.click('button:has-text("Einloggen")');
    
    await page.goto('/offer-detail/1');
    await page.click('button:has-text("💳 Jetzt Bezahlen")');
    await page.fill('input[name="cardNumber"]', '1234123412341234');
    await page.click('button:has-text("Kostenpflichtig buchen")');
    
    await expect(page.locator('text=Erfolgreich bezahlt')).toBeVisible();
});
```

---

## 🎯 Testing Strategy

**Current Approach:**
Wir fahren eine verschobene "Test-Pyramide". 
- Starker Fokus auf Kern-Services im Backend (Escrow, Math, Status-Transitions).
- Fokus auf kritische User Journeys im Frontend (Komponenten, die Geld abwickeln).

✅ **Pros:** Hohe Sicherheit im Payment-Lifecycle; E2E sichert ab, dass Module gemeinsam funktionieren. \
⚠️ **Cons:** Mangelnde Mock-Isolation bei einigen Angular Unit-Tests führt momentan zu Http-Timeouts (siehe *Aktueller Status*).
**Future Improvements:** Striktes Mocking des HttpClients im Frontend via `HttpTestingController`.

---

## 🔧 Mock Strategy

- **Im Backend:** Repositories dürfen im Service-Test nie direkt angesprochen werden. Nutze `@MockBean` und definiere das Verhalten via `Mockito.when(...)`.
- **Im Frontend:** Vermeide echte API Requests in Unit-Tests. Verwende `spyOn(service, 'method').and.returnValue(of(mockData))` um RxJS Observables direkt nachzustellen.

---

## 🐛 Troubleshooting

**"Port in Use" bei E2E Tests:**
Playwright schlägt fehl, wenn Frontend oder Backend nicht gestartet sind oder Ports (8080 / 4200) belegt sind. Starte die Server neu oder nutze Taskkill.

**Karma Test Timeout (Timeout - Async function):**
Wenn ein Angular-Test in einer Subscriber/Pipe endlos lädt. Dies bedeutet meistens, dass vergessen wurde `HttpTestingController` zu flushen / ein Dummy-Event auszulösen, oder `jasmine.DEFAULT_TIMEOUT_INTERVAL` wurde überschritten.
Lösung: Mocke HTTP Cals durch `of()` aus `rxjs`.

---

## 📈 Coverage Goals
- **Aktuelle Integration:** 
  - Backend Controller: ~80%
  - Frontend Services: ~60%
- **Ziel (Roadmap):** Wir streben eine Testabdeckung von *80% Line-Coverage* im kritischen Bezahl- und Routing-Bereich an.

---

## 🔄 CI/CD Integration

Diese Tests laufen automatisch über **GitHub Actions**. Unser Workflow fängt Änderungen sofort ab:

**Beispielhafter Workflow (Backend Maven):**
```yaml
name: Java CI with Maven
on:
  push:
    branches: [ "main" ]
  pull_request:
    branches: [ "main" ]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Set up JDK 21
      uses: actions/setup-java@v3
      with:
        java-version: '21'
        distribution: 'temurin'
    - name: Run Tests
      run: cd BACKEND && mvn -B test --file pom.xml
```

---

## 🎓 Best Practices

1. **Aussagekräftige Beschreibungen:** Nutze bei `it(...)` oder `test(...)` das "should... when..." Format. (z.B. `should return 400 when PIN is invalid`).
2. **Setup / Arrange klar trennen:** Optisch die Testblöcke in "Arrange", "Act", "Assert" (Given / When / Then) gliedern.
3. **Aufräumen (Teardown):** Sorge bei E2E Tests in der Datenbank für Bereinigung, oder erstelle für E2E-Runs dedizierte Testnutzer, die nicht produktiv stören.

---

## 🚦 Test Quality Checklist
Wenn du neue Tests hinzufügst, prüfe zuerst:
- [ ] Test läuft unabhängig davon in welcher Reihenfolge er aufgerufen wird?
- [ ] Keine direkten Datenbankabhängigkeiten im reinen Unit-Test? 
- [ ] Asynchrone Frontend-Events (`fixture.whenStable()`) berücksichtigt?
- [ ] Playwright Locators sind robust (besser `has-text` oder `data-testid` statt fragiler CSS Hierarchien)?

---

## 📞 Getting Help

- **Wenn Tests unerwartet fehlschlagen:** Schau zuerst, ob sich die Datenbank-Schema/Response-JSON-Struktur geändert hat ("DTO Mismatch"!).
- **Wenn du neue Tests schreiben möchtest:** Orientiere dich an der Setup-Methode von ähnlichen `*ControllerTest.java` oder `.spec.ts` Dateien.
- Bei blockierenden CI/CD Pipelines kannst du via Discord Kontakt zum Entwicklungs-Lead (KMS-Projekt) aufnehmen.

---
## 📊 Test Results Summary (März 2026)
Die Kernlogik für Payment und E2E ist funktional. Im Frontend (Angular Angular TestBed) bedarf es in naher Zukunft Refactoring beim PaymentModalComponent (`Cannot read properties of undefined (reading 'cardNumber')`), um die Http-Mockabdeckung wasserdicht zu machen. Backend ist stabil (lediglich TrackingService Dependency Injection bei einem Controller muss justiert werden).
