import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto('http://localhost:3000/login');

  // Click the Demo Login button for "User"
  await page.click('button:has-text("User")');

  // Wait for navigation to complete
  try {
    await page.waitForURL('**/order*', { timeout: 10000 });
  } catch (e) {
    console.log("Failed to navigate to order. Current URL:", page.url());
  }

  await page.waitForTimeout(2000); // Wait for data to load

  await page.screenshot({ path: 'orders_user_dashboard.png', fullPage: true });

  await browser.close();
})();
