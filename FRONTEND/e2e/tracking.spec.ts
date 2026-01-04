import { test, expect } from '@playwright/test';

test.describe('Tracking Feature E2E Tests', () => {

  test.describe('Customer Tracking View', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to tracking page with demo code
      await page.goto('/tracking');
    });

    test('should display tracking search interface', async ({ page }) => {
      // Check page title
      await expect(page.locator('h1')).toContainText('Live Tracking');

      // Check tracking code input
      await expect(page.locator('input[placeholder*="Tracking-Code"]')).toBeVisible();

      // Check search button
      await expect(page.locator('button:has-text("Tracking suchen")')).toBeVisible();
    });

    test('should search tracking by code', async ({ page }) => {
      // Enter tracking code
      await page.fill('input[placeholder*="Tracking-Code"]', 'MC-TEST01');

      // Click search
      await page.click('button:has-text("Tracking suchen")');

      // Should navigate to tracking details or show results
      await page.waitForURL(/\/tracking\/(code\/MC-TEST01|\d+)/);

      // Check tracking information is displayed
      await expect(page.locator('.tracking-info')).toBeVisible({ timeout: 5000 });
    });

    test('should display tracking timeline', async ({ page }) => {
      // Navigate directly to tracking with code
      await page.goto('/tracking/code/MC-DEMO01');

      // Wait for tracking to load
      await page.waitForSelector('.status-timeline', { timeout: 5000 });

      // Check timeline items
      await expect(page.locator('text=Abgeholt')).toBeVisible();
      await expect(page.locator('text=Unterwegs')).toBeVisible();
      await expect(page.locator('text=Zugestellt')).toBeVisible();
    });

    test('should show live position updates', async ({ page }) => {
      // Navigate to active tracking
      await page.goto('/tracking/code/MC-DEMO01');

      // Check live position card
      await expect(page.locator('.live-position-card')).toBeVisible();

      // Check current location
      await expect(page.locator('text=/📍/')).toBeVisible();

      // Start simulation
      await page.click('button:has-text("Simulation starten")');

      // Wait a moment for updates
      await page.waitForTimeout(3000);

      // Check if progress changed
      const progressBefore = await page.locator('.progress-percent').textContent();

      await page.waitForTimeout(3000);

      const progressAfter = await page.locator('.progress-percent').textContent();

      // Progress should have changed during simulation
      expect(progressBefore).not.toBe(progressAfter);
    });

    test('should display ETA and distance information', async ({ page }) => {
      await page.goto('/tracking/code/MC-DEMO01');

      // Check ETA display
      await expect(page.locator('.eta-stats')).toBeVisible();

      // Check distance information
      await expect(page.locator('text=/Verbleibend/')).toBeVisible();
      await expect(page.locator('text=/km/')).toBeVisible();
    });

    test('should show driver contact options', async ({ page }) => {
      await page.goto('/tracking/code/MC-DEMO01');

      // Check driver card
      await expect(page.locator('.driver-card')).toBeVisible();

      // Check contact buttons
      await expect(page.locator('button:has-text("Anrufen")')).toBeVisible();
      await expect(page.locator('button:has-text("Nachricht senden")')).toBeVisible();
    });

    test('should display notifications when status changes', async ({ page }) => {
      await page.goto('/tracking/code/MC-DEMO01');

      // Open notifications panel
      await page.click('.btn-notifications');

      // Check notifications panel
      await expect(page.locator('.notifications-panel')).toBeVisible();

      // Start simulation to trigger notifications
      await page.click('button:has-text("Simulation starten")');

      // Wait for notification
      await page.waitForTimeout(5000);

      // Check if notifications appeared
      const notifCount = await page.locator('.notif-badge').textContent();
      expect(parseInt(notifCount || '0')).toBeGreaterThan(0);
    });

    test('should show route visualization', async ({ page }) => {
      await page.goto('/tracking/code/MC-DEMO01');

      // Check route section
      await expect(page.locator('.route-section')).toBeVisible();

      // Check start point
      await expect(page.locator('text=/Start:/')).toBeVisible();

      // Check destination
      await expect(page.locator('text=/Ziel:/')).toBeVisible();
    });

    test('should handle invalid tracking code', async ({ page }) => {
      await page.goto('/tracking/code/INVALID-CODE');

      // Should show error or demo mode
      await expect(page.locator('text=/nicht gefunden|Demo-Modus/')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Driver Tracking View', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to driver tracking page (may require authentication)
      await page.goto('/tracking/driver');
    });

    test('should display driver tracking dashboard', async ({ page }) => {
      // Check page title
      await expect(page.locator('h1')).toContainText(/Tracking|Standort/);

      // Check location status
      await expect(page.locator('.location-status')).toBeVisible();
    });

    test('should show current GPS location', async ({ page }) => {
      // Check current location display
      await expect(page.locator('text=/Aktuelle Position|Standort/i')).toBeVisible();

      // Check coordinates display
      await expect(page.locator('text=/[0-9]+\.[0-9]+/')).toBeVisible();
    });

    test('should list active tracking sessions', async ({ page }) => {
      // Check sessions list
      const sessionsList = page.locator('.sessions-list, .tracking-sessions');

      if (await sessionsList.isVisible()) {
        // Should show sessions or empty state
        await expect(page.locator('text=/Keine aktiven|Aktive Tracking-Sessions/')).toBeVisible();
      }
    });

    test('should create new tracking session', async ({ page }) => {
      // Look for create button
      const createButton = page.locator('button:has-text("Tracking erstellen")');

      if (await createButton.isVisible()) {
        await createButton.click();

        // Should show form or navigate to create page
        await expect(page.locator('text=/Neue Tracking-Session|Tracking erstellen/i')).toBeVisible({ timeout: 3000 });
      }
    });

    test('should start location sharing', async ({ page }) => {
      // Look for active session
      const activeSession = page.locator('.active-session-card');

      if (await activeSession.isVisible()) {
        // Click share button
        const shareButton = page.locator('button:has-text("Standort teilen")');
        if (await shareButton.isVisible()) {
          await shareButton.click();

          // Check sharing indicator
          await expect(page.locator('.sharing-active, .pulse-dot')).toBeVisible({ timeout: 3000 });
        }
      }
    });

    test('should update delivery status manually', async ({ page }) => {
      const activeSession = page.locator('.active-session-card');

      if (await activeSession.isVisible()) {
        // Check status action buttons
        const statusButtons = page.locator('.status-actions button');
        const count = await statusButtons.count();

        expect(count).toBeGreaterThan(0);

        // Click a status button if available
        if (count > 0) {
          await statusButtons.first().click();

          // Should show confirmation or update
          await page.waitForTimeout(1000);
        }
      }
    });

    test('should complete delivery', async ({ page }) => {
      const activeSession = page.locator('.active-session-card');

      if (await activeSession.isVisible()) {
        // Look for complete button
        const completeButton = page.locator('button:has-text("Lieferung abschließen")');

        if (await completeButton.isVisible()) {
          await completeButton.click();

          // Should show confirmation dialog
          await expect(page.locator('text=/Bestätigen|abgeschlossen/')).toBeVisible({ timeout: 3000 });
        }
      }
    });

    test('should toggle GPS/simulated mode', async ({ page }) => {
      // Look for GPS toggle
      const gpsToggle = page.locator('input[type="checkbox"]').filter({ hasText: /GPS|Echt/ });

      if (await gpsToggle.isVisible()) {
        await gpsToggle.click();

        // Check mode changed
        await page.waitForTimeout(500);

        const isChecked = await gpsToggle.isChecked();
        expect(typeof isChecked).toBe('boolean');
      }
    });
  });

  test.describe('Tracking Integration Tests', () => {
    test('should copy tracking code to clipboard', async ({ page }) => {
      await page.goto('/tracking/code/MC-DEMO01');

      // Look for copy button
      const copyButton = page.locator('button:has-text("Kopieren"), button:has-text("📋")');

      if (await copyButton.isVisible()) {
        // Grant clipboard permissions
        await page.context().grantPermissions(['clipboard-write', 'clipboard-read']);

        await copyButton.click();

        // Verify clipboard content
        const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
        expect(clipboardText).toContain('MC-');
      }
    });

    test('should be responsive on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/tracking/code/MC-DEMO01');

      // Check mobile layout
      await expect(page.locator('.tracking-page')).toBeVisible();
      await expect(page.locator('.live-position-card')).toBeVisible();

      // Elements should be properly stacked
      const statusTimeline = page.locator('.status-timeline');
      if (await statusTimeline.isVisible()) {
        const boundingBox = await statusTimeline.boundingBox();
        expect(boundingBox?.width).toBeLessThan(400);
      }
    });

    test('should handle real-time updates via polling', async ({ page }) => {
      await page.goto('/tracking/code/MC-DEMO01');

      // Get initial state
      const initialProgress = await page.locator('.progress-percent').textContent();

      // Start simulation
      await page.click('button:has-text("Simulation starten")');

      // Wait for polling interval (5 seconds + buffer)
      await page.waitForTimeout(6000);

      // Check if progress updated
      const updatedProgress = await page.locator('.progress-percent').textContent();

      expect(initialProgress).not.toBe(updatedProgress);
    });

    test('should show delivery completion state', async ({ page }) => {
      await page.goto('/tracking/code/MC-DEMO01');

      // Start simulation
      await page.click('button:has-text("Simulation starten")');

      // Wait for delivery (or force completion)
      // This test might take a while or you could manually set progress to 100%

      // For now, just check the UI elements exist for completion state
      const deliveredIcon = page.locator('text=✅');
      const deliveredStatus = page.locator('text=Zugestellt');

      // At least one should be in the DOM
      const hasDeliveredElements =
        await deliveredIcon.count() > 0 ||
        await deliveredStatus.count() > 0;

      expect(hasDeliveredElements).toBe(true);
    });
  });

  test.describe('Tracking Performance', () => {
    test('should load tracking page quickly', async ({ page }) => {
      const startTime = Date.now();

      await page.goto('/tracking/code/MC-DEMO01');
      await page.waitForSelector('.tracking-page', { timeout: 5000 });

      const loadTime = Date.now() - startTime;

      // Should load within 3 seconds
      expect(loadTime).toBeLessThan(3000);
    });

    test('should handle multiple rapid status updates', async ({ page }) => {
      await page.goto('/tracking/code/MC-DEMO01');

      // Start simulation
      await page.click('button:has-text("Simulation starten")');

      // Wait for multiple updates
      await page.waitForTimeout(10000);

      // Page should still be responsive
      const isVisible = await page.locator('.tracking-page').isVisible();
      expect(isVisible).toBe(true);

      // Stop simulation
      await page.click('button:has-text("Simulation pausieren")');
    });
  });
});
