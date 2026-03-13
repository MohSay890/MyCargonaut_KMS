import { test, expect } from '@playwright/test';

test.describe('MyCargonaut Negative Edge Cases', () => {

  test('Registration Form Edge Cases (Empty / Invalid fields)', async ({ page }) => {
    test.setTimeout(30000);
    await page.goto('/registration');

    // Submit empty form
    await page.click('button[type="submit"]');

    // Check if error message appears
    await expect(page.locator('.error-message').first()).toBeVisible();
    await expect(page.locator('.error-message').first()).toContainText('Bitte fülle alle Pflichtfelder aus');

    console.log('\n======================================================');
    console.log('🎉 SUCCESS: The Empty Form Validation test accomplished successfully!');
    console.log('======================================================\n');
  });

  test('Login Form Edge Cases (Invalid Credentials)', async ({ page }) => {
    test.setTimeout(30000);

    // Attempt to login with an invalid user and wrong password
    await page.goto('/login');
    await page.fill('#email', 'unknown.user.12345@test.com');
    await page.fill('#password', 'WrongPassword!123');

    // Wait for the backend response to reject the login
    await Promise.all([
      page.waitForResponse(resp => resp.url().includes('login') && resp.status() >= 400),
      page.click('button[type="submit"]')
    ]);

    // Check if error message appears on the screen
    await expect(page.locator('.error-message').first()).toBeVisible({ timeout: 5000 });

    console.log('\n======================================================');
    console.log('🎉 SUCCESS: The Edge Case test for Invalid Login accomplished successfully!');
    console.log('======================================================\n');
  });

});
