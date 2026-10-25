import { describe, it, expect } from 'vitest';
import { normalizeUrl, validateUrlSafety, detectAtsFromUrl } from '../../lib/security/url';

describe('URL Normalization', () => {
  it('should remove tracking parameters and sort search params', () => {
    const raw = 'https://example.com/job/123?utm_source=whatsapp&ref=partner&gclid=abc&q=search';
    const normalized = normalizeUrl(raw);
    expect(normalized).toBe('https://example.com/job/123?q=search&ref=partner');
  });

  it('should lowercase hostname and remove trailing slash', () => {
    const raw = 'HTTPS://BOARD.GREENHOUSE.IO/careers/';
    const normalized = normalizeUrl(raw);
    expect(normalized).toBe('https://board.greenhouse.io/careers');
  });
});

describe('SSRF Protection & Protocol Shield', () => {
  it('should flag unsafe local target hostnames', async () => {
    const check1 = await validateUrlSafety('http://localhost:3000/api');
    expect(check1.safe).toBe(false);
    expect(check1.reason).toContain('SSRF Shield');

    const check2 = await validateUrlSafety('http://127.0.0.1/admin');
    expect(check2.safe).toBe(false);
  });

  it('should flag non http/https protocols', async () => {
    const check = await validateUrlSafety('javascript:alert(1)');
    expect(check.safe).toBe(false);
    expect(check.reason).toContain('must start with http:// or https://');
  });

  it('should approve safe external URL targets', async () => {
    const check = await validateUrlSafety('https://boards.greenhouse.io/accenture');
    expect(check.safe).toBe(true);
    expect(check.domain).toBe('boards.greenhouse.io');
  });
});

describe('ATS Detection from URLs', () => {
  it('should detect standard ATS names from domains', () => {
    expect(detectAtsFromUrl('https://boards.greenhouse.io/company/jobs/123')).toBe('greenhouse');
    expect(detectAtsFromUrl('https://jobs.lever.co/company/abc-def')).toBe('lever');
    expect(detectAtsFromUrl('https://jobs.ashbyhq.com/company/def')).toBe('ashby');
    expect(detectAtsFromUrl('https://company.myworkdayjobs.com/Careers')).toBe('workday');
    expect(detectAtsFromUrl('https://example.com/other')).toBe('unknown');
  });
});
