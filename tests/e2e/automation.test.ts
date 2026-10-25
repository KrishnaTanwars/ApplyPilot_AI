import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import { chromium, Browser, Page } from 'playwright';
import { GreenhouseAdapter } from '../../automation/adapters/GreenhouseAdapter';
import { LeverAdapter } from '../../automation/adapters/LeverAdapter';

let mockServer: http.Server;
let browser: Browser;

beforeAll(async () => {
  // 1. Start mock ATS server programmatically on port 3002 to avoid conflicts
  mockServer = http.createServer((req, res) => {
    const url = req.url || '';
    if (url === '/greenhouse') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <form id="application_form" action="/submit" method="POST">
          <input type="text" id="first_name" name="first_name" required value="" />
          <input type="text" id="last_name" name="last_name" required value="" />
          <input type="email" id="email" name="email" required value="" />
          <input type="file" id="resume" name="resume" required />
          <button type="submit" id="submit_app">Submit</button>
        </form>
      `);
    } else if (url === '/lever') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <form class="lever-job" action="/submit" method="POST">
          <div class="application-question">
            <label class="application-label">Full Name</label>
            <input type="text" name="name" required value="" />
          </div>
          <div class="application-question">
            <label class="application-label">Email Address</label>
            <input type="email" name="email" required value="" />
          </div>
          <button type="submit" id="btn-submit">Submit</button>
        </form>
      `);
    } else {
      res.writeHead(404);
      res.end();
    }
  });

  await new Promise<void>((resolve) => {
    mockServer.listen(3002, () => resolve());
  });

  // 2. Launch browser
  browser = await chromium.launch({ headless: true });
});

afterAll(async () => {
  await browser.close();
  await new Promise<void>((resolve) => {
    mockServer.close(() => resolve());
  });
});

describe('E2E ATS Adapters automation test', () => {
  it('should scan and fill Greenhouse Mock form', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('http://localhost:3002/greenhouse');

    const adapter = new GreenhouseAdapter();
    const detected = await adapter.detect(page);
    expect(detected).toBe(true);

    const scan = await adapter.scanForm(page);
    expect(scan.fields.length).toBe(4);

    const emailField = scan.fields.find(f => f.fieldType === 'email');
    expect(emailField).toBeDefined();

    // Fill fields
    const firstNameField = scan.fields.find(f => f.fieldId.includes('first_name'));
    if (firstNameField) {
      await adapter.fillField(page, firstNameField, 'Krishna');
      const val = await page.$eval('#first_name', (el: any) => el.value);
      expect(val).toBe('Krishna');
    }

    await page.close();
    await context.close();
  });

  it('should scan and fill Lever Mock form', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('http://localhost:3002/lever');

    const adapter = new LeverAdapter();
    const detected = await adapter.detect(page);
    expect(detected).toBe(true);

    const scan = await adapter.scanForm(page);
    expect(scan.fields.length).toBe(2);

    const nameField = scan.fields.find(f => f.fieldId === 'name');
    expect(nameField).toBeDefined();

    if (nameField) {
      await adapter.fillField(page, nameField, 'Krishna Tanwar');
      const val = await page.$eval('input[name="name"]', (el: any) => el.value);
      expect(val).toBe('Krishna Tanwar');
    }

    await page.close();
    await context.close();
  });
});
