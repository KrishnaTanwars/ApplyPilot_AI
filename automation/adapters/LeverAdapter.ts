import { Page } from 'playwright';
import { ATSAdapter, FormScanResult, FormFieldInfo } from './types';

export class LeverAdapter implements ATSAdapter {
  async detect(page: Page): Promise<boolean> {
    const hasLeverClass = await page.$('.lever-job, .application-question');
    const isLeverDomain = page.url().includes('jobs.lever.co');
    return !!(hasLeverClass || isLeverDomain);
  }

  async scanForm(page: Page): Promise<FormScanResult> {
    const fields: FormFieldInfo[] = [];
    
    // Lever forms are made of cards with class `.application-question`
    const questions = await page.$$('.application-question');

    for (const q of questions) {
      // Find label
      const labelEl = await q.$('.application-label, label');
      if (!labelEl) continue;
      let labelText = await labelEl.innerText() || '';
      
      // Clean label
      labelText = labelText.replace(/[\*\:\?]/g, '').trim();

      // Find input / textarea / select inside this question card
      const input = await q.$('input, textarea, select');
      if (!input) continue;

      const type = await input.getAttribute('type') || '';
      const name = await input.getAttribute('name') || '';
      const id = await input.getAttribute('id') || '';
      const tagName = await input.evaluate(e => e.tagName.toLowerCase());

      if (type === 'hidden' || type === 'submit' || type === 'button') continue;

      // Skip duplicate checks if checkbox/radio elements share name
      const fieldId = name || id || labelText;
      if (fields.some(f => f.fieldId === fieldId)) continue;

      // Detect fieldType
      let fieldType: FormFieldInfo['fieldType'] = 'text';
      if (type === 'file' || name.includes('resume') || name.includes('cv')) {
        fieldType = 'file';
      } else if (type === 'email') {
        fieldType = 'email';
      } else if (type === 'tel' || type === 'phone') {
        fieldType = 'phone';
      } else if (tagName === 'textarea') {
        fieldType = 'textarea';
      } else if (tagName === 'select') {
        fieldType = 'select';
      } else if (type === 'checkbox') {
        fieldType = 'checkbox';
      } else if (type === 'radio') {
        fieldType = 'radio';
      }

      // Check required
      const requiredIndicator = await q.$('.application-field-required, .required, [required]');
      const isRequired = requiredIndicator !== null || labelText.includes('*') || labelText.includes('required');

      // Options
      let options: string[] = [];
      if (fieldType === 'select') {
        const optionElms = await q.$$('option');
        for (const opt of optionElms) {
          const val = await opt.innerText();
          if (val.trim()) options.push(val.trim());
        }
      } else if (fieldType === 'radio' || fieldType === 'checkbox') {
        // Collect choices within this question block
        const optionElms = await q.$$('span, label');
        for (const opt of optionElms) {
          const val = await opt.innerText();
          if (val.trim() && val.trim() !== labelText) {
            options.push(val.trim());
          }
        }
      }

      fields.push({
        fieldId,
        label: labelText || fieldId,
        normalizedLabel: labelText.toLowerCase().replace(/[^a-z0-9]/g, '').trim(),
        fieldType,
        required: isRequired,
        options: options.length > 0 ? options : undefined
      });
    }

    return {
      fields,
      atsType: 'lever',
      submitSelector: '#btn-submit, button[type="submit"]'
    };
  }

  async fillField(page: Page, field: FormFieldInfo, value: string): Promise<boolean> {
    try {
      // Find element by name, id, placeholder or associated question block text
      let el = await page.$(`[name="${field.fieldId}"], #${field.fieldId}`);
      if (!el) {
        // Find question card by matching label, then fetch input
        const questionCards = await page.$$('.application-question');
        for (const q of questionCards) {
          const label = await q.$('.application-label, label');
          if (label) {
            const txt = await label.innerText();
            if (txt.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().includes(field.normalizedLabel)) {
              el = await q.$('input, textarea, select');
              break;
            }
          }
        }
      }

      if (!el) return false;

      if (field.fieldType === 'select') {
        const options = field.options || [];
        const match = options.find(o => o.toLowerCase().includes(value.toLowerCase()) || value.toLowerCase().includes(o.toLowerCase())) || options[0];
        if (match) {
          await el.selectOption({ label: match });
        }
      } else if (field.fieldType === 'radio' || field.fieldType === 'checkbox') {
        // Click option containing matching label text inside the block
        const questionBlock = await el.evaluateHandle(e => e.closest('.application-question'));
        const optionsContainer = questionBlock.asElement();
        if (optionsContainer) {
          const inputs = await optionsContainer.$$('input');
          for (const input of inputs) {
            const val = await input.getAttribute('value') || '';
            const nextSiblingText = await input.evaluate((node: any) => {
              const sib = node.nextElementSibling;
              return sib ? (sib.textContent || '') : '';
            });
            
            const checkLabel = (val + ' ' + nextSiblingText).toLowerCase();
            if (checkLabel.includes(value.toLowerCase()) || value.toLowerCase().includes(checkLabel)) {
              await input.click();
              break;
            }
          }
        }
      } else {
        await el.fill('');
        await el.type(value, { delay: 30 });
      }
      return true;
    } catch (err) {
      console.error(`Failed to fill Lever field ${field.label}:`, err);
      return false;
    }
  }

  async uploadResume(page: Page, fileInputSelector: string, filePath: string): Promise<boolean> {
    try {
      const fileInput = await page.$(fileInputSelector) || await page.$('#resume-upload-input, input[type="file"]');
      if (!fileInput) return false;
      await fileInput.setInputFiles(filePath);
      await page.waitForTimeout(2000); // Lever uploads resume and auto-parses, wait a bit
      return true;
    } catch (err) {
      console.error('Lever resume upload failed:', err);
      return false;
    }
  }

  async detectValidationErrors(page: Page): Promise<string[]> {
    return await page.evaluate(() => {
      const errors: string[] = [];
      const errElms = document.querySelectorAll('.error-message, .error, .required-error');
      errElms.forEach(el => {
        const text = el.textContent?.trim();
        if (text) errors.push(text);
      });
      return errors;
    });
  }

  async detectCaptcha(page: Page): Promise<boolean> {
    return await page.evaluate(() => {
      return !!document.querySelector('.g-recaptcha, iframe[src*="recaptcha"], iframe[src*="hcaptcha"]');
    });
  }
}
