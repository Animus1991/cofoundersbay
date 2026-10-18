import { createRequire } from 'node:module';
const requireFromWeb = createRequire(new URL('../../package.json', import.meta.url));
const { chromium } = requireFromWeb('@playwright/test');

const OUT = new URL('.', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, deviceScaleFactor: 2 });
await page.goto('file:///' + OUT.replace(/\\/g, '/') + '/index.html');
await page.waitForTimeout(400);
await page.screenshot({ path: OUT + '/sheet.png', fullPage: true });
await browser.close();
console.log('shot:', OUT + '/sheet.png');
