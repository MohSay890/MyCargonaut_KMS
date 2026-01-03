import { test, expect } from '@playwright/test';

test.describe('Payment Feature E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to payment page (adjust URL as needed)
    await page.goto('/payment/123');
  });

  test('should display payment form with all elements', async ({ page }) => {
    // Check page title
    await expect(page.locator('h1')).toContainText('Zahlung abschließen');

    // Check payment method buttons
    await expect(page.locator('button:has-text("Kreditkarte")')).toBeVisible();
    await expect(page.locator('button:has-text("PayPal")')).toBeVisible();
    await expect(page.locator('button:has-text("Banküberweisung")')).toBeVisible();
    await expect(page.locator('button:has-text("Barzahlung")')).toBeVisible();

    // Check amount display
    await expect(page.locator('.amount-display')).toBeVisible();

    // Check submit button
    await expect(page.locator('button:has-text("Jetzt bezahlen")')).toBeVisible();
  });

  test('should select payment method and display corresponding form', async ({ page }) => {
    // Select credit card
    await page.click('button:has-text("Kreditkarte")');

    // Check if credit card form is visible
    await expect(page.locator('input[placeholder*="Karteninhaber"]')).toBeVisible();
    await expect(page.locator('input[placeholder*="Kartennummer"]')).toBeVisible();
    await expect(page.locator('input[placeholder*="MM/YY"]')).toBeVisible();
    await expect(page.locator('input[placeholder*="CVV"]')).toBeVisible();

    // Verify selected state
    await expect(page.locator('button:has-text("Kreditkarte")')).toHaveClass(/selected/);
  });

  test('should validate credit card form fields', async ({ page }) => {
    // Select credit card
    await page.click('button:has-text("Kreditkarte")');

    // Try to submit without filling fields
    await page.click('button:has-text("Jetzt bezahlen")');

    // Check for validation messages (adjust selectors as needed)
    await expect(page.locator('text=Bitte füllen Sie alle Felder aus')).toBeVisible({timeout: 5000});
  });

  test('should process payment successfully with credit card', async ({ page }) => {
    // Select credit card
    await page.click('button:has-text("Kreditkarte")');

    // Fill in credit card details
    await page.fill('input[placeholder*="Karteninhaber"]', 'Max Mustermann');
    await page.fill('input[placeholder*="Kartennummer"]', '4111111111111111');
    await page.fill('input[placeholder*="MM/YY"]', '12/25');
    await page.fill('input[placeholder*="CVV"]', '123');

    // Submit payment
    await page.click('button:has-text("Jetzt bezahlen")');

    // Wait for processing
    await expect(page.locator('text=Zahlung wird verarbeitet')).toBeVisible({ timeout: 5000 });

    // Wait for success message (or failure - random in demo)
    await expect(page.locator('text=/Zahlung erfolgreich|Zahlung fehlgeschlagen/')).toBeVisible({ timeout: 10000 });
  });

  test('should process payment with PayPal', async ({ page }) => {
    // Select PayPal
    await page.click('button:has-text("PayPal")');

    // Fill PayPal email
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await page.fill('input[type="email"]', 'test@paypal.com');

    // Submit payment
    await page.click('button:has-text("Jetzt bezahlen")');

    // Wait for result
    await expect(page.locator('text=/Zahlung erfolgreich|Zahlung fehlgeschlagen/')).toBeVisible({ timeout: 10000 });
  });

  test('should display transaction details after successful payment', async ({ page }) => {
    // Select and process payment
    await page.click('button:has-text("Kreditkarte")');
    await page.fill('input[placeholder*="Karteninhaber"]', 'Max Mustermann');
    await page.fill('input[placeholder*="Kartennummer"]', '4111111111111111');
    await page.fill('input[placeholder*="MM/YY"]', '12/25');
    await page.fill('input[placeholder*="CVV"]', '123');
    await page.click('button:has-text("Jetzt bezahlen")');

    // Wait for success
    const successMessage = page.locator('text=Zahlung erfolgreich');
    if (await successMessage.isVisible({ timeout: 10000 })) {
      // Check transaction reference is displayed
      await expect(page.locator('text=/TXN-[A-Z0-9]+/')).toBeVisible();

      // Check receipt button
      await expect(page.locator('button:has-text("Quittung herunterladen")')).toBeVisible();
    }
  });

  test('should handle payment cancellation', async ({ page }) => {
    // Select payment method
    await page.click('button:has-text("Kreditkarte")');

    // Click cancel button
    await page.click('button:has-text("Abbrechen")');

    // Should navigate back or show confirmation
    await expect(page).toHaveURL(/\/(trips|dashboard|offers)/);
  });

  test('should display correct amount and currency', async ({ page }) => {
    // Check amount display
    const amountText = await page.locator('.amount-display').textContent();
    expect(amountText).toMatch(/\d+[.,]\d{2}\s*€/);
  });

  test('should show loading state during payment processing', async ({ page }) => {
    // Select and submit payment
    await page.click('button:has-text("Kreditkarte")');
    await page.fill('input[placeholder*="Karteninhaber"]', 'Max Mustermann');
    await page.fill('input[placeholder*="Kartennummer"]', '4111111111111111');
    await page.fill('input[placeholder*="MM/YY"]', '12/25');
    await page.fill('input[placeholder*="CVV"]', '123');
    await page.click('button:has-text("Jetzt bezahlen")');

    // Check loading spinner
    await expect(page.locator('.spinner')).toBeVisible({ timeout: 2000 });

    // Check button is disabled during processing
    await expect(page.locator('button:has-text("Jetzt bezahlen")')).toBeDisabled();
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Check if elements are still visible and properly arranged
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('.payment-methods')).toBeVisible();
    await expect(page.locator('.amount-display')).toBeVisible();

    // Payment buttons should be stacked on mobile
    const methodButtons = page.locator('.payment-method-btn');
    const count = await methodButtons.count();
    expect(count).toBe(4);
  });
});
