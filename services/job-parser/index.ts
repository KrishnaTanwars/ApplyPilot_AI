import { aiParseJobMessage } from '@/lib/ai/gemini';
import { ParsedJobMessage } from '@/schemas/ai';

// Regular expression to extract URLs from text
const URL_REGEX = /(https?:\/\/[^\s]+)/gi;

export interface ExtractedJobMessageInfo {
  urls: string[];
  parsedData: ParsedJobMessage;
}

/**
 * Parses raw text from a WhatsApp job message.
 * Extracts any URLs and structures the job details using Gemini AI.
 */
export async function parseJobMessage(rawText: string): Promise<ExtractedJobMessageInfo> {
  if (!rawText || !rawText.trim()) {
    throw new Error('Raw WhatsApp message cannot be empty');
  }

  // 1. Extract URLs deterministically using regex
  const urls: string[] = [];
  let match;
  // Reset regex index and execute
  const regex = new RegExp(URL_REGEX);
  while ((match = regex.exec(rawText)) !== null) {
    let url = match[0];
    
    // Clean trailing punctuation that might get captured (like parentheses, periods, emojis)
    url = url.replace(/[.,;:!)\]"'`?]+$/, '');
    
    if (!urls.includes(url)) {
      urls.push(url);
    }
  }

  // 2. Call Gemini AI structured parser
  let parsedData: ParsedJobMessage;
  try {
    parsedData = await aiParseJobMessage(rawText);
  } catch (err: any) {
    console.error('Gemini AI WhatsApp parser failed:', err);
    throw new Error(`AI Job Parsing failed: ${err.message}`);
  }

  return {
    urls,
    parsedData
  };
}
