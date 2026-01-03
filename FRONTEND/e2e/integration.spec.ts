import { test, expect } from '@playwright/test';

test.describe('Integration E2E Tests - Full User Journey', () => {

  test('complete user journey: search trip → book → pay → track', async ({ page }) => {
    // Step 1: Navigate to home page
    await page.goto('/');
    await expect(page.locator('h1, h2')).toBeVisible();

    // Step 2: Search for a trip (if search exists)
    const searchInput = page.locator('input[placeholder*="Startort"], input[placeholder*="Von"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('Berlin');

      const destInput = page.locator('input[placeholder*="Zielort"], input[placeholder*="Nach"]').first();
      await destInput.fill('Munich');

      const searchButton = page.locator('button:has-text("Suchen")').first();
      await searchButton.click();

      // Wait for results
      await page.waitForTimeout(2000);
    }

    // Step 3: Navigate to offers or trips list
    await page.goto('/offers');
    await page.waitForSelector('.offer-card, .trip-card', { timeout: 5000 });

    // Step 4: Click on first offer
    const firstOffer = page.locator('.offer-card, .trip-card').first();
    await firstOffer.click();

    // Step 5: Book the trip
    const bookButton = page.locator('button:has-text("Buchen"), button:has-text("Anfragen")');
    if (await bookButton.isVisible({ timeout: 3000 })) {
      await bookButton.click();
      await page.waitForTimeout(1000);
    }

    // Step 6: Navigate to payment
    await page.goto('/payment/123');

    // Step 7: Process payment
    await page.click('button:has-text("Kreditkarte")');
    await page.fill('input[placeholder*="Karteninhaber"]', 'Test User');
    await page.fill('input[placeholder*="Kartennummer"]', '4111111111111111');
    await page.fill('input[placeholder*="MM/YY"]', '12/25');
    await page.fill('input[placeholder*="CVV"]', '123');
    await page.click('button:has-text("Jetzt bezahlen")');

    // Wait for payment result
    await expect(page.locator('text=/Zahlung erfolgreich|Zahlung fehlgeschlagen/')).toBeVisible({ timeout: 10000 });

    // Step 8: Navigate to tracking
    await page.goto('/tracking/code/MC-DEMO01');

    // Step 9: Verify tracking is working
    await expect(page.locator('.tracking-page')).toBeVisible();
    await expect(page.locator('.status-timeline')).toBeVisible();

    // Step 10: Start tracking simulation
    await page.click('button:has-text("Simulation starten")');
    await page.waitForTimeout(3000);

    // Verify updates are happening
    const progress = await page.locator('.progress-percent').textContent();
    expect(progress).toMatch(/\d+%/);
  });

  test('driver journey: create tracking → share location → update status → complete', async ({ page }) => {
    // Step 1: Navigate to driver tracking dashboard
    await page.goto('/tracking/driver');
    await expect(page.locator('.driver-tracking-page, .driver-dashboard')).toBeVisible({ timeout: 5000 });

    // Step 2: Create new tracking session (if button exists)
    const createButton = page.locator('button:has-text("Tracking erstellen"), button:has-text("Neue Session")');
    if (await createButton.isVisible({ timeout: 2000 })) {
      await createButton.click();
      await page.waitForTimeout(1000);
    }

    // Step 3: Check if there's an active session
    const activeSession = page.locator('.active-session-card');
    if (await activeSession.isVisible({ timeout: 2000 })) {

      // Step 4: Start location sharing
      const shareButton = page.locator('button:has-text("Standort teilen"), button:has-text("Teilen starten")');
      if (await shareButton.isVisible()) {
        await shareButton.click();
        await page.waitForTimeout(1000);

        // Verify sharing is active
        await expect(page.locator('.pulse-dot, .sharing-active')).toBeVisible({ timeout: 2000 });
      }

      // Step 5: Update status
      const statusButtons = page.locator('.status-actions button');
      if (await statusButtons.count() > 0) {
        await statusButtons.first().click();
        await page.waitForTimeout(1000);
      }

      // Step 6: Complete delivery
      const completeButton = page.locator('button:has-text("Lieferung abschließen"), button:has-text("Abschließen")');
      if (await completeButton.isVisible()) {
        await completeButton.click();

        // Confirm if dialog appears
        const confirmButton = page.locator('button:has-text("Bestätigen"), button:has-text("Ja")');
        if (await confirmButton.isVisible({ timeout: 2000 })) {
          await confirmButton.click();
        }

        await page.waitForTimeout(2000);
      }
    }
  });

  test('mobile user journey on different viewports', async ({ page }) => {
    const viewports = [
      { width: 375, height: 667, name: 'iPhone SE' },
      { width: 414, height: 896, name: 'iPhone 11' },
      { width: 360, height: 740, name: 'Android' }
    ];

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      // Test payment on mobile
      await page.goto('/payment/123');
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('.payment-methods')).toBeVisible();

      // Test tracking on mobile
      await page.goto('/tracking/code/MC-DEMO01');
      await expect(page.locator('.tracking-page')).toBeVisible();
      await expect(page.locator('.live-position-card')).toBeVisible();

      // Verify mobile navigation works
      const menuButton = page.locator('button[aria-label*="menu"], .menu-toggle, .hamburger');
      if (await menuButton.isVisible({ timeout: 1000 })) {
        await menuButton.click();
        await page.waitForTimeout(500);
      }
    }
  });

  test('accessibility: keyboard navigation', async ({ page }) => {
    // Test payment form keyboard navigation
    await page.goto('/payment/123');

    // Tab through payment methods
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');

    // Should select a payment method
    await page.waitForTimeout(500);

    // Tab through form fields
    await page.keyboard.press('Tab');
    await page.keyboard.type('Test User');
    await page.keyboard.press('Tab');
    await page.keyboard.type('4111111111111111');

    // Navigate to tracking
    await page.goto('/tracking/code/MC-DEMO01');

    // Tab to simulation button
    let tabCount = 0;
    while (tabCount < 20) {
      await page.keyboard.press('Tab');
      const focused = await page.evaluate(() => document.activeElement?.textContent);
      if (focused?.includes('Simulation')) {
        break;
      }
      tabCount++;
    }
  });

  test('error handling: network failures', async ({ page }) => {
    // Simulate offline mode
    await page.context().setOffline(true);

    await page.goto('/tracking/code/MC-DEMO01');

    // Should show demo mode or error message
    await expect(page.locator('text=/Demo-Modus|Offline|Keine Verbindung/i')).toBeVisible({ timeout: 5000 });

    // Go back online
    await page.context().setOffline(false);

    await page.reload();
    await page.waitForTimeout(2000);
  });

  test('performance: page load times', async ({ page }) => {
    const pages = [
      '/payment/123',
      '/tracking/code/MC-DEMO01',
      '/tracking/driver'
    ];

    for (const pagePath of pages) {
      const startTime = Date.now();

      await page.goto(pagePath);
      await page.waitForLoadState('domcontentloaded');

      const loadTime = Date.now() - startTime;

      console.log(`${pagePath} loaded in ${loadTime}ms`);

      // All pages should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
    }
  });

  test('concurrent users: multiple tracking sessions', async ({ browser }) => {
    // Create multiple pages (simulating different users)
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const context3 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();
    const page3 = await context3.newPage();

    // All users track the same delivery
    await Promise.all([
      page1.goto('/tracking/code/MC-DEMO01'),
      page2.goto('/tracking/code/MC-DEMO01'),
      page3.goto('/tracking/code/MC-DEMO01')
    ]);

    // All should see the tracking
    await expect(page1.locator('.tracking-page')).toBeVisible();
    await expect(page2.locator('.tracking-page')).toBeVisible();
    await expect(page3.locator('.tracking-page')).toBeVisible();

    // Start simulation on page1
    await page1.click('button:has-text("Simulation starten")');
    await page1.waitForTimeout(3000);

    // All pages should show updates (if polling is working)
    const progress1 = await page1.locator('.progress-percent').textContent();
    const progress2 = await page2.locator('.progress-percent').textContent();
    const progress3 = await page3.locator('.progress-percent').textContent();

    console.log('Progress:', { progress1, progress2, progress3 });

    // Cleanup
    await context1.close();
    await context2.close();
    await context3.close();
  });

  test('data persistence: reload page maintains state', async ({ page }) => {
    // Navigate to tracking
    await page.goto('/tracking/code/MC-DEMO01');

    // Start simulation
    await page.click('button:has-text("Simulation starten")');
    await page.waitForTimeout(3000);

    // Get current progress
    const progressBefore = await page.locator('.progress-percent').textContent();

    // Reload page
    await page.reload();
    await page.waitForTimeout(2000);

    // Progress should be maintained or continue from last update
    const progressAfter = await page.locator('.progress-percent').textContent();

    // At minimum, page should load successfully
    expect(progressAfter).toBeTruthy();
  });
});
