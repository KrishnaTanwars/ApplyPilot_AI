import { NextResponse } from 'next/server';
import { chromium } from 'playwright';

export async function POST() {
  let browserInstance;
  try {
    console.log('Testing Playwright headed browser...');
    
    // Launch headed browser briefly to test setup
    browserInstance = await chromium.launch({
      headless: false,
      args: ['--disable-blink-features=AutomationControlled']
    });
    
    const page = await browserInstance.newPage();
    await page.goto('https://example.com', { waitUntil: 'load', timeout: 15000 });
    
    // Hold it open for 3 seconds so the user can verify it launched successfully
    await page.waitForTimeout(3000);
    
    await browserInstance.close();
    
    return NextResponse.json({ success: true, message: 'Browser launched successfully!' });
  } catch (err: any) {
    console.error('Playwright browser test failed:', err);
    if (browserInstance) {
      try {
        await browserInstance.close();
      } catch {}
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
