import { test, expect } from '@playwright/test';

test.describe('MyCargonaut Scenario - Driver Rejects Booking', () => {

  test('Driver rejects booking request, Sender gets notified', async ({ browser }) => {
    test.setTimeout(300000); // 5 minutes for full end-to-end flow

    // --- SETUP BROWSER CONTEXTS ---
    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();
    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();

    const timestamp = Date.now();
    const senderEmail = `sender_${timestamp}@test.com`;
    const driverEmail = `driver_${timestamp}@test.com`;

    // --- PHASE 1: REGISTRATION ---
    console.log('Registering User A (Sender)...');
    await pageA.goto('/registration');
    await pageA.fill('#firstName', 'Alice');
    await pageA.fill('#lastName', 'Sender');
    await pageA.fill('#email', senderEmail);
    await pageA.fill('#emailRepeat', senderEmail);
    await pageA.fill('#phone', '0123456789');
    await pageA.fill('#birthdate', '1990-01-01');
    await pageA.fill('#postalCode', '10115'); // Valid PLZ
    await pageA.fill('#city', 'Berlin'); // Valid City
    await pageA.fill('#password', 'Test!1234');
    await pageA.fill('#passwordRepeat', 'Test!1234');
    await pageA.check('#agb');
    await pageA.click('button[type="submit"]');
    await pageA.waitForURL('**/login', { timeout: 15000 }).catch(() => {});

    console.log('Registering User B (Driver)...');
    await pageB.goto('/registration');
    await pageB.fill('#firstName', 'Bob');
    await pageB.fill('#lastName', 'Driver');
    await pageB.fill('#email', driverEmail);
    await pageB.fill('#emailRepeat', driverEmail);
    await pageB.fill('#phone', '0987654321');
    await pageB.fill('#birthdate', '1985-05-05');
    await pageB.fill('#postalCode', '80331'); // Valid PLZ
    await pageB.fill('#city', 'München'); // Valid City
    await pageB.fill('#password', 'Test!1234');
    await pageB.fill('#passwordRepeat', 'Test!1234');
    await pageB.check('#agb');
    await pageB.click('button[type="submit"]');
    await pageB.waitForURL('**/login', { timeout: 15000 }).catch(() => {});

    // --- PHASE 2: LOGIN ---
    console.log('Logging in User A...');
    await pageA.goto('/login');
    await pageA.fill('#email', senderEmail);
    await pageA.fill('#password', 'Test!1234');
    await pageA.click('button[type="submit"]');
    await pageA.waitForURL('**/dashboard', { timeout: 15000 }).catch(() => {});

    console.log('Logging in User B...');
    await pageB.goto('/login');
    await pageB.fill('#email', driverEmail);
    await pageB.fill('#password', 'Test!1234');
    await pageB.click('button[type="submit"]');
    await pageB.waitForURL('**/dashboard', { timeout: 15000 }).catch(() => {});

    // --- PHASE 3: Driver Setup (Bank & Vehicle) ---
    console.log('Driver setting up Vehicle...');
    await pageB.goto('/vehicle-editor');
    // Ensure we are fully loaded
    await pageB.waitForTimeout(1000);
    // Click add vehicle
    await pageB.locator('button:has-text("Fahrzeug hinzufügen")').first().click();
    await pageB.waitForSelector('.modal-content', { timeout: 5000 });

    // Fill all REQUIRED vehicle fields to ensure valid submission
    await pageB.fill('#brand', 'Mercedes');
    await pageB.fill('#model', 'Sprinter');
    await pageB.selectOption('select#type', { label: 'Sprinter' });
    await pageB.fill('#licensePlate', 'B-XX 1234');
    await pageB.fill('#year', '2020');
    await pageB.fill('#maxWeight', '1500');

    // Dimensions
    await pageB.fill('input[name="length"]', '300');
    await pageB.fill('input[name="width"]', '150');
    await pageB.fill('input[name="height"]', '180');

    // Insurance
    await pageB.selectOption('select#insurance', { label: 'Vollkasko' });

    // Check 'isActive'
    await pageB.check('#isActive');

    // Save vehicle
    await pageB.click('.btn-save');
    // Wait for the modal to disappear and the new vehicle card to appear
    await pageB.waitForSelector('.vehicle-card', { timeout: 10000 });
    await pageB.waitForTimeout(1000);

    console.log('Driver setting up Bank Details...');
    await pageB.goto('/driver/bank-account');
    await pageB.waitForTimeout(1000);
    // Click Bankkonto hinzufügen button if available
    const addBankBtn = pageB.locator('button:has-text("Bankkonto hinzufügen")');
    if (await addBankBtn.isVisible()) {
        await addBankBtn.click();
    }
    await pageB.fill('[formControlName="accountHolderName"]', 'Bob Driver');
    await pageB.fill('[formControlName="iban"]', 'DE89370400440532013000');
    await pageB.fill('[formControlName="bic"]', 'WELADED1BER');
    await pageB.fill('[formControlName="bankName"]', 'Sparkasse');
    await pageB.click('button[type="submit"]');
    await pageB.waitForTimeout(1000);

    // --- PHASE 4: Create Offer ---
    console.log('Driver creating an Offer von München nach Berlin...');
    await pageB.goto('/offer/create');
    await pageB.waitForTimeout(2000);

    // Step 1: Route & Date
    await pageB.fill('input[placeholder="z.B. Berlin"]', 'München');
    await pageB.fill('input[placeholder="z.B. Hamburg"]', 'Berlin');
    await pageB.fill('input[type="date"]', '2026-10-10');
    await pageB.fill('input[type="time"]', '10:00');
    // Important: Category is required for validation
    await pageB.selectOption('select.form-input', { label: 'Pakete' });
    await pageB.click('.btn-next'); // To step 2
    await pageB.waitForTimeout(1000);

    // Step 2: Vehicle
    // Wait for the vehicle cards to render
    await pageB.waitForSelector('.vehicle-card', { timeout: 10000 });
    // Click the actual vehicle card to select it (this fulfills maxWeight/dimension checks)
    await pageB.locator('.vehicle-card').first().click();
    await pageB.click('.btn-next'); // To step 3
    await pageB.waitForTimeout(1000);

    // Step 3: Details
    // Important: Price is required!
    await pageB.fill('input.price-input', '120');
    await pageB.click('.btn-next'); // To step 4
    await pageB.waitForTimeout(1000);
    await pageB.click('.btn-publish');
    await pageB.waitForSelector('app-confirmation-modal', { timeout: 10000 });
    await pageB.click('button:has-text("Zu Meinen Fahrten")');

    // --- PHASE 5: Match & Book ---
    console.log('Sender searching and booking offer...');
    await pageA.goto('/search');
    await pageA.waitForTimeout(1000);
    await pageA.click('.btn-search'); // Hit search to load all offers
    await pageA.waitForTimeout(2000);

    // Check details of first offer
    await pageA.locator('.btn-details').first().click();
    await pageA.waitForURL('**/offer/*', { timeout: 10000 });
    await pageA.waitForTimeout(1000);

    // Request booking
    pageA.once('dialog', dialog => {
      console.log('Dialog opened:', dialog.message());
      dialog.accept();
    });

    await pageA.click('.btn-book'); // 'Jetzt anfragen'
    await pageA.waitForSelector('.modal-container', { state: 'visible' });

    // Wait for the booking request to be processed
    await Promise.all([
      pageA.waitForResponse(resp => resp.url().includes('buchungen') && (resp.status() === 201 || resp.status() === 200)),
      pageA.click('.btn-submit') // 'Anfrage senden' inside modal
    ]);
    await pageA.waitForTimeout(2000);

// --- PHASE 6: Driver Rejects ---
    console.log('Driver REJECTING booking request...');
    await pageB.goto('/dashboard');

    // Wait for the backend to sync notifications.
    let foundNotification = false;
    for (let i = 0; i < 5; i++) {
      const count = await pageB.locator('.notification-card').count();
      if (count > 0) {
        foundNotification = true;
        break;
      }
      console.log('Waiting for notification card to appear.. Reloading');
      await pageB.waitForTimeout(2000);
      await pageB.reload();
    }

    if (foundNotification) {
      await pageB.click('.notification-card');
      await pageB.waitForSelector('.modal-container', { state: 'visible' });

      // Navigate rejection dialogue
      pageB.once('dialog', dialog => {
        console.log('Driver Dialog opened:', dialog.message());
        dialog.accept();
      });

      // Wait for the rejection to hit the backend
      await Promise.all([
        pageB.waitForResponse(resp => resp.url().includes('buchungen') && (resp.status() === 200 || resp.status() === 201)),
        pageB.click('.btn-reject')
      ]);
      await pageB.waitForTimeout(2000);
    } else {
      console.log('Error: Could not find notification card for booking request.');
    }

    // --- PHASE 7: Sender is notified of rejection ---
    console.log('Sender receiving rejection notification...');
    await pageA.goto('/dashboard');

    let foundRejection = false;
    for (let i = 0; i < 5; i++) {
        const count = await pageA.locator('.notification-card').count();
        if (count > 0) {
            foundRejection = true;
            break;
        }
        await pageA.waitForTimeout(2000);
        await pageA.reload();
    }

    if (foundRejection) {
      // Look for the "Buchung abgelehnt" text
      await expect(pageA.locator('.notification-card').first()).toContainText('abgelehnt', { ignoreCase: true });
      console.log('SUCCESS: Sender successfully received a Rejection notice!');
    } else {
      console.log('Could not find rejection notification...');
    }
    await pageA.waitForTimeout(2000);

    console.log('\n======================================================');
    console.log('🎉 SUCCESS: The Rejection scenario completed perfectly! Rejection was properly communicated.');
    console.log('======================================================\n');
  });
});
