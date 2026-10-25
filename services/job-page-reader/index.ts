import { chromium } from 'playwright';
import { aiParseOfficialJobPage } from '@/lib/ai/gemini';
import { OfficialJobData } from '@/schemas/ai';
import { detectAtsFromUrl } from '@/lib/security/url';

export interface CrawledJobPageInfo {
  finalUrl: string;
  atsType: 'greenhouse' | 'lever' | 'ashby' | 'workday' | 'generic' | 'unknown';
  extractedText: string;
  parsedData: OfficialJobData;
}

/**
 * Opens a job page using Playwright to render SPA content, extracts visible text,
 * detects the applicant tracking system (ATS), and parses job details with Gemini.
 */
export async function crawlAndParseJobPage(url: string): Promise<CrawledJobPageInfo> {
  if (!url) {
    throw new Error('URL is required for crawling');
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 }
  });
  const page = await context.newPage();

  try {
    // Enable navigation timeout of 30 seconds
    await page.goto(url, { waitUntil: 'load', timeout: 30000 });
    
    // Extra sleep to ensure AJAX content hydrates
    await page.waitForTimeout(2000);

    const finalUrl = page.url();
    
    // 1. Detect ATS type from DOM structure and URL
    let atsType = detectAtsFromUrl(finalUrl);
    
    // Scan DOM markers if URL check was uncertain
    if (atsType === 'unknown') {
      const pageHtml = await page.content();
      if (pageHtml.includes('boards.greenhouse.io') || (await page.$('#application_form')) !== null) {
        atsType = 'greenhouse';
      } else if (pageHtml.includes('jobs.lever.co') || (await page.$('.lever-job')) !== null) {
        atsType = 'lever';
      } else if (pageHtml.includes('jobs.ashbyhq.com') || pageHtml.includes('ashby-embed') || (await page.$('#ashby-job-posting')) !== null) {
        atsType = 'ashby';
      } else if (pageHtml.includes('myworkdayjobs.com') || pageHtml.includes('workday')) {
        atsType = 'workday';
      }
    }

    // 2. Extract visible body text
    const extractedText = await page.evaluate(() => {
      // Get readable text inside visible tags, excluding scripts, styles, noscript, etc.
      const ignoreTags = ['script', 'style', 'noscript', 'iframe', 'svg', 'nav', 'footer'];
      ignoreTags.forEach(tag => {
        const elms = document.querySelectorAll(tag);
        elms.forEach(el => el.remove());
      });
      return document.body.innerText || '';
    });

    if (!extractedText.trim()) {
      throw new Error('Page contained no readable text content');
    }

    // 3. AI parsing on extracted text (bounded range if too huge)
    // Keep first 15000 chars to avoid model context bloat while preserving core job details
    const cleanText = extractedText.substring(0, 15000);
    const parsedData = await aiParseOfficialJobPage(cleanText);

    // Override atsType if detected during crawl
    if (atsType !== 'unknown') {
      parsedData.atsType = atsType;
    }

    return {
      finalUrl,
      atsType,
      extractedText: cleanText,
      parsedData
    };
  } finally {
    await page.close();
    await context.close();
    await browser.close();
  }
}
