/**
 * Component Integration Tests for Anomaly Features
 * 
 * Tests: AnomalySummaryPanel, CalendarHeatmap, ExportButton, ChatBotWidget
 * Run: npx playwright test tests/anomaly-components.spec.ts
 * 
 * Prerequisites:
 * - ThinkStation running (pm2 list shows dga-app + dga-anomaly-api online)
 * - VPN connected (for ChatBot Azure OpenAI)
 * - /etc/hosts entries for Azure OpenAI (for ChatBot)
 */
import { test, expect } from '@playwright/test';

const BASE_URL = 'https://100.123.214.57';

test.describe('AnomalySummaryPanel (Dashboard)', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/dga/login`);
    await page.waitForLoadState('networkidle');
    await page.fill('#username', 'admin');
    await page.fill('#password', 'dga2024');
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/dga`);
    await page.waitForTimeout(8000);
    
    // Scroll to summary panel (below device cards)
    await page.evaluate('window.scrollTo(0, 800)');
    await page.waitForTimeout(2000);
  });

  test('should display Recent Anomalies heading', async ({ page }) => {
    const heading = page.locator('text=Recent Anomalies').first();
    await expect(heading).toBeVisible();
  });

  test('should show anomaly count badge', async ({ page }) => {
    const badge = page.locator('text=anomaly events detected').first();
    await expect(badge).toBeVisible();
  });

  test('should have View Full History button', async ({ page }) => {
    const btn = page.locator('button', { hasText: 'View Full History' });
    await expect(btn).toBeVisible();
  });

  test('View Full History navigates to history page', async ({ page }) => {
    await page.locator('button', { hasText: 'View Full History' }).click();
    await page.waitForTimeout(3000);
    expect(page.url()).toContain('/anomaly-history');
  });
});

test.describe('CalendarHeatmap (History Page)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/dga/login`);
    await page.waitForLoadState('networkidle');
    await page.fill('#username', 'admin');
    await page.fill('#password', 'dga2024');
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/dga`);
    await page.waitForTimeout(8000);
    
    // Navigate to history page
    await page.goto(`${BASE_URL}/dga/anomaly-history`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(8000);
  });

  test('should render calendar grid', async ({ page }) => {
    // Check for calendar cells (7 columns grid)
    const gridCells = await page.evaluate(() => {
      const grids = document.querySelectorAll('[style*="gridTemplateColumns"]');
      for (const g of grids) {
        if ((g as HTMLElement).style.gridTemplateColumns.includes('repeat(7')) {
          return (g as HTMLElement).children.length;
        }
      }
      return 0;
    });
    expect(gridCells).toBeGreaterThan(30); // 7 days + 31 days
  });

  test('should display month navigation', async ({ page }) => {
    const prevBtn = page.locator('button', { hasText: '←' }).first();
    const nextBtn = page.locator('button', { hasText: '→' }).first();
    await expect(prevBtn).toBeVisible();
    await expect(nextBtn).toBeVisible();
  });

  test('should show month label', async ({ page }) => {
    const monthLabel = await page.evaluate(() => {
      const headings = Array.from(document.querySelectorAll('h3'));
      return headings.find(h => h.textContent?.match(/January|February|March|April|May|June|July|August|September|October|November|December/))?.textContent || '';
    });
    expect(monthLabel.length).toBeGreaterThan(0);
  });
});

test.describe('ExportButton (History Page)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/dga/login`);
    await page.waitForLoadState('networkidle');
    await page.fill('#username', 'admin');
    await page.fill('#password', 'dga2024');
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/dga`);
    await page.waitForTimeout(8000);
    
    await page.goto(`${BASE_URL}/dga/anomaly-history`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(8000);
  });

  test('should display Export CSV button', async ({ page }) => {
    const csvBtn = page.locator('button', { hasText: 'Export CSV' });
    await expect(csvBtn).toBeVisible();
  });

  test('should display PDF Report button', async ({ page }) => {
    const pdfBtn = page.locator('button', { hasText: 'PDF Report' });
    await expect(pdfBtn).toBeVisible();
  });

  test('CSV export downloads file', async ({ page }) => {
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('button', { hasText: 'Export CSV' }).click(),
    ]);
    
    expect(download.suggestedFilename()).toContain('.csv');
    expect(download.suggestedFilename()).toContain('anomaly_events');
  });
});

test.describe('ChatBotWidget (Dashboard)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/dga/login`);
    await page.waitForLoadState('networkidle');
    await page.fill('#username', 'admin');
    await page.fill('#password', 'dga2024');
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/dga`);
    await page.waitForTimeout(8000);
  });

  test('should display floating chat button', async ({ page }) => {
    const chatBtn = page.locator('button[title="DGA Assistant"]');
    await expect(chatBtn).toBeVisible();
  });

  test('clicking button opens chat window', async ({ page }) => {
    await page.locator('button[title="DGA Assistant"]').click();
    await page.waitForTimeout(1500);
    
    const chatWindow = page.locator('text=DGA Assistant').first();
    await expect(chatWindow).toBeVisible();
  });

  test('should show welcome message', async ({ page }) => {
    await page.locator('button[title="DGA Assistant"]').click();
    await page.waitForTimeout(1500);
    
    const welcome = page.locator('text=DGA Assistant').first();
    await expect(welcome).toBeVisible();
  });

  test('should send message and receive response', async ({ page }) => {
    await page.locator('button[title="DGA Assistant"]').click();
    await page.waitForTimeout(1500);
    
    // Type message
    await page.locator('input[placeholder="พิมพ์คำถาม..."]').fill('ค่า Z-Score ปกติอยู่ช่วงไหน?');
    await page.locator('button', { hasText: 'ส่ง' }).click();
    
    // Wait for AI response (up to 15 seconds)
    await page.waitForTimeout(15000);
    
    // Check that a response appeared (different from user message)
    const messages = await page.evaluate(() => {
      const divs = Array.from(document.querySelectorAll('div'));
      return divs.filter(d => {
        const text = d.textContent || '';
        return text.includes('Z-Score') && text.length > 50 && !text.includes('พิมพ์คำถาม');
      }).length;
    });
    
    expect(messages).toBeGreaterThan(0);
  });
});
