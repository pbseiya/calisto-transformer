const { chromium } = require("playwright");
const path = process.argv[2] || "/tmp/screenshot.png";

(async () => {
  const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  
  await page.goto("http://localhost:3001/dga", { waitUntil: "domcontentloaded", timeout: 15000 });
  await page.waitForTimeout(2000);
  
  const usernameInput = page.locator('input[type="text"], input[name="username"], input[placeholder*="user" i]');
  const passwordInput = page.locator('input[type="password"]');
  const loginBtn = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("เข้าสู่ระบบ")');
  
  await usernameInput.fill("admin");
  await passwordInput.fill("dga2024");
  await loginBtn.click();
  await page.waitForTimeout(5000);
  
  await page.screenshot({ path: path, fullPage: false });
  console.log("Screenshot saved to", path);
  await browser.close();
})();
