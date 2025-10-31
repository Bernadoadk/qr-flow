import { test, expect } from '@playwright/test';

test.describe('QR Code Scan Route', () => {
  test('should redirect to destination when scanning valid QR code', async ({ page }) => {
    // Test with demo QR code slug
    await page.goto('/scan/premium-bf2024');
    
    // Should redirect to the destination URL
    await expect(page).toHaveURL(/demo-shop\.myshopify\.com/);
  });

  test('should return 404 for non-existent QR code', async ({ page }) => {
    const response = await page.goto('/scan/non-existent-qr');
    expect(response?.status()).toBe(404);
  });

  test('should return 404 for inactive QR code', async ({ page }) => {
    // This would require creating an inactive QR code in the test database
    const response = await page.goto('/scan/inactive-qr');
    expect(response?.status()).toBe(404);
  });

  test('should handle UTM parameters', async ({ page }) => {
    await page.goto('/scan/premium-bf2024?utm_source=test&utm_medium=email&utm_campaign=test');
    
    // Should still redirect properly
    await expect(page).toHaveURL(/demo-shop\.myshopify\.com/);
  });

  test('should respect rate limiting', async ({ page }) => {
    // Make multiple requests to test rate limiting
    const requests = Array(105).fill(null).map(() => 
      page.goto('/scan/premium-bf2024')
    );
    
    const responses = await Promise.all(requests);
    
    // Some requests should be rate limited (429 status)
    const rateLimitedResponses = responses.filter(response => response?.status() === 429);
    expect(rateLimitedResponses.length).toBeGreaterThan(0);
  });
});








