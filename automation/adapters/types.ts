import { Page } from 'playwright';

export interface FormFieldInfo {
  fieldId: string; // DOM id or name or selector
  label: string; // Visible label text
  normalizedLabel: string; // Simplified label for matching
  fieldType: 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'file' | 'unknown';
  required: boolean;
  options?: string[]; // Dropdown or radio choices
  currentValue?: string;
}

export interface FormScanResult {
  fields: FormFieldInfo[];
  atsType: 'greenhouse' | 'lever' | 'ashby' | 'generic';
  submitSelector: string;
}

export interface ATSAdapter {
  detect(page: Page): Promise<boolean>;
  scanForm(page: Page): Promise<FormScanResult>;
  fillField(page: Page, field: FormFieldInfo, value: string): Promise<boolean>;
  uploadResume(page: Page, fileInputSelector: string, filePath: string): Promise<boolean>;
  detectValidationErrors(page: Page): Promise<string[]>;
  detectCaptcha(page: Page): Promise<boolean>;
}
