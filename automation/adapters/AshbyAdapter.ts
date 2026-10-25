import { Page } from 'playwright';
import { ATSAdapter, FormScanResult, FormFieldInfo } from './types';

export class AshbyAdapter implements ATSAdapter {
  async detect(page: Page): Promise<boolean> {
    const isAshbyDomain = page.url().includes('jobs.ashbyhq.com');
    const hasAshbyDOM = await page.$('[data-ashby-job-posting-id], #ashby-job-posting');
    return !!(isAshbyDomain || hasAshbyDOM);
  }

  async scanForm(page: Page): Promise<FormScanResult> {
    const fields: FormFieldInfo[] = [];
    
    // Ashby inputs are standard but often wrapped in custom container div elements
    const inputs = await page.$$('input, textarea, select');

    for (const el of inputs) {
      const type = await el.getAttribute('type') || '';
      const name = await el.getAttribute('name') || '';
      const id = await el.getAttribute('id') || '';
      const tagName = await el.evaluate(e => e.tagName.toLowerCase());

      if (type === 'hidden' || type === 'submit' || type === 'button') continue;

      // Label detection
      let labelText = '';
      if (id) {
        const labelEl = await page.$(`label[for="${id}"]`);
        if (labelEl) labelText = await labelEl.innerText();
      }
      if (!labelText) {
        // Look up parent hierarchy for text
        labelText = await el.evaluate(node => {
          let parent = node.parentElement;
          for (let i = 0; i < 3; i++) {
            if (!parent) break;
            const text = parent.innerText || '';
            const lines = text.trim().split('\n');
            if (lines.length > 0 && lines[0].trim()) {
              return lines[0].trim().replace(/[\*\:\?]/g, '');
            }
            parent = parent.parentElement;
          }
          return '';
        });
      }

      labelText = labelText.replace(/[\*\:\?]/g, '').trim();
      const fieldId = name || id || labelText;

      if (!fieldId || fields.some(f => f.fieldId === fieldId)) continue;

      // Field type
      let fieldType: FormFieldInfo['fieldType'] = 'text';
      if (type === 'file' || name.toLowerCase().includes('resume') || labelText.toLowerCase().includes('resume')) {
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

      const requiredAttr = await el.getAttribute('required');
      const isRequired = requiredAttr !== null || labelText.toLowerCase().includes('required') || labelText.includes('*');

      let options: string[] = [];
      if (fieldType === 'select') {
        const optElms = await el.$$('option');
        for (const opt of optElms) {
          const val = await opt.innerText();
          if (val.trim()) options.push(val.trim());
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

    // Submit button in Ashby is often a button containing text "Submit Application" or similar
    return {
      fields,
      atsType: 'ashby',
      submitSelector: 'button[type="submit"], button:has-text("Submit")'
    };
  }

  async fillField(page: Page, field: FormFieldInfo, value: string): Promise<boolean> {
    try {
      const selector = `[name="${field.fieldId}"], #${field.fieldId}, input[aria-label*="${field.label}"]`;
      const el = await page.$(selector);
      if (!el) return false;

      if (field.fieldType === 'select') {
        const options = field.options || [];
        const match = options.find(o => o.toLowerCase().includes(value.toLowerCase()) || value.toLowerCase().includes(o.toLowerCase())) || options[0];
        if (match) {
          await el.selectOption({ label: match });
        }
      } else if (field.fieldType === 'checkbox') {
        const shouldCheck = ['yes', 'true', '1', 'checked'].includes(value.toLowerCase());
        const isChecked = await el.isChecked();
        if (shouldCheck !== isChecked) {
          await el.click();
        }
      } else if (field.fieldType === 'radio') {
        const grpName = await el.getAttribute('name');
        if (grpName) {
          const radios = await page.$$(`input[name="${grpName}"]`);
          for (const radio of radios) {
            const rVal = await radio.getAttribute('value') || '';
            if (rVal.toLowerCase().includes(value.toLowerCase())) {
              await radio.click();
              break;
            }
          }
        } else {
          await el.click();
        }
      } else {
        await el.fill('');
        await el.type(value, { delay: 30 });
      }
      return true;
    } catch (err) {
      console.error(`Failed to fill Ashby field ${field.label}:`, err);
      return false;
    }
  }

  async uploadResume(page: Page, fileInputSelector: string, filePath: string): Promise<boolean> {
    try {
      const fileInput = await page.$(fileInputSelector) || await page.$('input[type="file"]');
      if (!fileInput) return false;
      await fileInput.setInputFiles(filePath);
      await page.waitForTimeout(1500);
      return true;
    } catch (err) {
      console.error('Ashby resume upload failed:', err);
      return false;
    }
  }

  async detectValidationErrors(page: Page): Promise<string[]> {
    return await page.evaluate(() => {
      const errors: string[] = [];
      const errorElms = document.querySelectorAll('.ashby-form-error, [aria-invalid="true"]');
      errorElms.forEach(el => {
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
