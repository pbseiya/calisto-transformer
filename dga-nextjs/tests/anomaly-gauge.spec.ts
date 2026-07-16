import { expect, test } from '@playwright/test';

test.describe('AnomalyGaugeTimeline', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('https://100.123.214.57/dga/login');
    await page.fill('#username', 'admin');
    await page.fill('#password', 'dga2024');
    await page.click('button[type="submit"]');
    await page.waitForURL('https://100.123.214.57/dga');
    await page.waitForTimeout(8000);
    
    // Scroll to component
    for (let i = 0; i < 8; i++) {
      await page.evaluate('window.scrollBy(0, 600)');
      await page.waitForTimeout(500);
    }
  });

  test('should render anomaly dashboard', async ({ page }) => {
    const dashboard = page.locator('.anomaly-dashboard');
    await expect(dashboard).toBeVisible();
  });

  test('should show device selector buttons', async ({ page }) => {
    const buttons = page.locator('.device-btn');
    const count = await buttons.count();
    expect(count).toBeGreaterThan(20); // Should have ~21 devices
  });

  test('should display device name in gauge labels', async ({ page }) => {
    const gaugeDevices = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.gauge-device')).map(el => el.innerText);
    });
    expect(gaugeDevices.length).toBe(3);
    expect(gaugeDevices[0]).toContain('DA'); // Should contain device code
  });

  test('should show UCL and LCL control lines', async ({ page }) => {
    const uclLine = page.locator('.control-line.ucl');
    const lclLine = page.locator('.control-line.lcl');
    await expect(uclLine).toBeVisible();
    await expect(lclLine).toBeVisible();
  });

  test('should display Y-axis sigma labels', async ({ page }) => {
    const yTicks = page.locator('.y-tick');
    const count = await yTicks.count();
    expect(count).toBe(7); // -6σ, -4σ, -2σ, 0, +2σ, +4σ, +6σ
  });

  test('should show tooltip on hover', async ({ page }) => {
    const chart = page.locator('.timeline-chart');
    await chart.hover({ position: { x: 500, y: 140 } });
    await page.waitForTimeout(1000);
    
    const tooltip = page.locator('.tooltip');
    await expect(tooltip).toBeVisible();
  });

  test('should switch devices when clicking button', async ({ page }) => {
    const buttons = page.locator('.device-btn');
    if (await buttons.count() > 1) {
      const secondDevice = await buttons.nth(1).innerText();
      await buttons.nth(1).click();
      await page.waitForTimeout(1000);
      
      const activeDevice = await page.locator('.device-btn.active').innerText();
      expect(activeDevice).toBe(secondDevice);
    }
  });

  test('should show header stats for H2/CO/WC', async ({ page }) => {
    const stats = page.locator('.stat-item');
    const count = await stats.count();
    expect(count).toBe(3); // H₂, CO, WC
  });
});
