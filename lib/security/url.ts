import { URL } from 'url';
import dns from 'dns';
import { promisify } from 'util';

const lookupPromise = promisify(dns.lookup);

// List of tracking query parameters to safely strip
const TRACKING_PARAMS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'fbclid',
  'gclid',
  '_hsenc',
  '_hsmi',
  'mc_cid',
  'mc_eid',
  'mkt_tok'
];

/**
 * Normalizes a URL for duplicate detection.
 * - Converts hostname to lowercase
 * - Strips common tracking query parameters
 * - Sorts query parameters alphabetically
 * - Removes trailing slashes
 * - Removes default ports (80 for http, 443 for https)
 */
export function normalizeUrl(urlStr: string): string {
  try {
    const trimmed = urlStr.trim();
    if (!trimmed) return '';

    // Add protocol if missing (assume https)
    let fullUrl = trimmed;
    if (!/^https?:\/\//i.test(trimmed)) {
      fullUrl = 'https://' + trimmed;
    }

    const parsed = new URL(fullUrl);
    
    // Lowercase host
    parsed.hostname = parsed.hostname.toLowerCase();

    // Clean tracking params
    TRACKING_PARAMS.forEach(param => {
      parsed.searchParams.delete(param);
    });

    // Sort query parameters
    const searchParams = Array.from(parsed.searchParams.entries());
    searchParams.sort((a, b) => a[0].localeCompare(b[0]));
    
    // Clear and re-append sorted params
    parsed.search = '';
    searchParams.forEach(([key, val]) => {
      parsed.searchParams.append(key, val);
    });

    // Remove default ports
    if (parsed.protocol === 'http:' && parsed.port === '80') {
      parsed.port = '';
    } else if (parsed.protocol === 'https:' && parsed.port === '443') {
      parsed.port = '';
    }

    // Format output and remove trailing slash
    let result = parsed.toString();
    if (result.endsWith('/')) {
      result = result.slice(0, -1);
    }
    
    return result;
  } catch (err) {
    console.error('URL normalization failed:', err);
    return urlStr;
  }
}

/**
 * Validates the safety of a URL.
 * - Rejects non-HTTP(S) protocols (javascript:, file:, data:, etc.)
 * - Screens host against local/private network ranges to prevent SSRF
 * - Validates host resolution
 */
export async function validateUrlSafety(urlStr: string): Promise<{
  safe: boolean;
  reason?: string;
  domain?: string;
}> {
  try {
    const trimmed = urlStr.trim();
    if (!trimmed) {
      return { safe: false, reason: 'Empty URL' };
    }

    // Protocol check
    if (!/^https?:\/\//i.test(trimmed)) {
      return { safe: false, reason: 'URL must start with http:// or https://' };
    }

    const parsed = new URL(trimmed);
    const hostname = parsed.hostname;

    if (!hostname) {
      return { safe: false, reason: 'Missing hostname in URL' };
    }

    // SSRF Check - block localhost, loopback, private ranges
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '[::1]' ||
      hostname.endsWith('.local')
    ) {
      return { safe: false, reason: 'SSRF Shield: Private localhost targets are not allowed' };
    }

    // Resolve IP address to check for private subnets
    let ip: string;
    try {
      const lookupResult = await lookupPromise(hostname);
      ip = lookupResult.address;
    } catch {
      return { safe: false, reason: `SSRF Shield: DNS resolution failed for hostname "${hostname}"` };
    }

    // Parse IP check
    if (isPrivateIp(ip)) {
      return { safe: false, reason: `SSRF Shield: Resolved IP ${ip} belongs to a private network address space` };
    }

    // Flag suspicious/malformed domains
    let isSuspicious = false;
    if (hostname.includes('bit.ly') || hostname.includes('tinyurl.com') || hostname.includes('t.co')) {
      // These are redirect shorteners, which are allowed but should resolve to the final target
    }

    return { safe: true, domain: hostname };
  } catch (err: any) {
    return { safe: false, reason: `Invalid URL format: ${err.message}` };
  }
}

/**
 * Helper to identify private IP address spaces (RFC 1918 + loopback)
 */
function isPrivateIp(ip: string): boolean {
  // Loopback (127.0.0.1/8)
  if (ip.startsWith('127.')) return true;

  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some(isNaN)) {
    // Check for IPv6 local ranges
    return ip.startsWith('fe80:') || ip.startsWith('::1') || ip === '::';
  }

  const [p0, p1] = parts;
  // Class A private (10.0.0.0/8)
  if (p0 === 10) return true;
  // Class B private (172.16.0.0/12)
  if (p0 === 172 && p1 >= 16 && p1 <= 31) return true;
  // Class C private (192.168.0.0/16)
  if (p0 === 192 && p1 === 168) return true;
  // Carrier-grade NAT (100.64.0.0/10)
  if (p0 === 100 && p1 >= 64 && p1 <= 127) return true;
  // Link-local (169.254.0.0/16)
  if (p0 === 169 && p1 === 254) return true;

  return false;
}

/**
 * Follows a redirect chain and returns the final target URL.
 * Bounded redirect count to prevent infinite loop redirects.
 */
export async function followRedirectChain(urlStr: string, maxRedirects = 5): Promise<{
  finalUrl: string;
  chain: string[];
  atsType: 'greenhouse' | 'lever' | 'ashby' | 'workday' | 'generic' | 'unknown';
}> {
  let currentUrl = urlStr;
  const chain: string[] = [urlStr];
  let redirectCount = 0;

  while (redirectCount < maxRedirects) {
    try {
      // Let's do a quiet HEAD request first
      const res = await fetch(currentUrl, {
        method: 'HEAD',
        redirect: 'manual',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });

      const location = res.headers.get('location');
      if (location) {
        // Resolve relative URL redirects if any
        const nextUrl = new URL(location, currentUrl).toString();
        
        // Prevent redirect loop
        if (chain.includes(nextUrl)) {
          break;
        }

        currentUrl = nextUrl;
        chain.push(currentUrl);
        redirectCount++;
      } else {
        break; // No redirect header, we reached the destination
      }
    } catch (err) {
      // If HEAD fails, try GET with redirect manual
      try {
        const res = await fetch(currentUrl, {
          method: 'GET',
          redirect: 'manual',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });
        const location = res.headers.get('location');
        if (location) {
          const nextUrl = new URL(location, currentUrl).toString();
          if (chain.includes(nextUrl)) break;
          currentUrl = nextUrl;
          chain.push(currentUrl);
          redirectCount++;
        } else {
          break;
        }
      } catch {
        break; // If fetch fails, return whatever currentUrl is
      }
    }
  }

  // Detect ATS from final URL
  const atsType = detectAtsFromUrl(currentUrl);

  return {
    finalUrl: currentUrl,
    chain,
    atsType
  };
}

/**
 * Detects ATS platform based on hostname or URL structure patterns
 */
export function detectAtsFromUrl(urlStr: string): 'greenhouse' | 'lever' | 'ashby' | 'workday' | 'generic' | 'unknown' {
  try {
    const parsed = new URL(urlStr);
    const host = parsed.hostname;

    if (host.includes('boards.greenhouse.io') || parsed.pathname.includes('/greenhouse/')) {
      return 'greenhouse';
    }
    if (host.includes('jobs.lever.co') || parsed.pathname.includes('/lever/')) {
      return 'lever';
    }
    if (host.includes('jobs.ashbyhq.com') || parsed.pathname.includes('/ashby/')) {
      return 'ashby';
    }
    if (host.includes('myworkdayjobs.com') || parsed.pathname.includes('/workday/')) {
      return 'workday';
    }

    return 'unknown';
  } catch {
    return 'unknown';
  }
}
