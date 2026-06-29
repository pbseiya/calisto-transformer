const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto("http://localhost:3001/dga/login", { waitUntil: "networkidle", timeout: 10000 });
  
  // Take before-click screenshot
  await page.screenshot({ path: "/tmp/dga-pwd-before.png", fullPage: false });
  console.log("Before click saved");
  
  // Click show password button
  await page.locator("button[aria-label=Show password]").click();
  await page.waitForTimeout(500);
  
  // Take after-click screenshot
  await page.screenshot({ path: "/tmp/dga-pwd-after.png", fullPage: false });
  console.log("After click saved");
  
  // Type some text to confirm it shows
  await page.locator("#password").fill("test123");
  await page.waitForTimeout(300);
  await page.screenshot({ path: "/tmp/dga-pwd-after-text.png", fullPage: false });
  console.log("After text saved");
  
  await browser.close();
})();
