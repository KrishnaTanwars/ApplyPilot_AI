import { Page } from 'playwright';
import { ATSAdapter, FormScanResult, FormFieldInfo } from './types';

export class GenericFormAdapter implements ATSAdapter {
  async detect(page: Page): Promise<boolean> {
    // Falls back to any standard HTML form or page containing inputs
    const inputs = await page.$$('input, textarea, select');
    return inputs.length > 0;
  }

  async scanForm(page: Page): Promise<FormScanResult> {
    const fields: FormFieldInfo[] = [];
    const inputs = await page.$$('input, textarea, select');

    for (const el of inputs) {
      const type = await el.getAttribute('type') || '';
      const name = await el.getAttribute('name') || '';
      const id = await el.getAttribute('id') || '';
      const placeholder = await el.getAttribute('placeholder') || '';
      const tagName = await el.evaluate(e => e.tagName.toLowerCase());

      if (type === 'hidden' || type === 'submit' || type === 'button' || type === 'image') {
        continue;
      }

      // Check checkbox/radio duplicates
      const fieldId = name || id || placeholder;
      if (!fieldId || fields.some(f => f.fieldId === fieldId)) continue;

      // Extract label
      let labelText = '';
      if (id) {
        const labelEl = await page.$(`label[for="${id}"]`);
        if (labelEl) labelText = await labelEl.innerText();
      }
      if (!labelText && placeholder) {
        labelText = placeholder;
      }
      if (!labelText) {
        // Parent text check
        labelText = await el.evaluate(node => {
          let parent = node.parentElement;
          for (let i = 0; i < 3; i++) {
            if (!parent) break;
            const text = parent.innerText || '';
            const lines = text.trim().split('\n');
            if (lines.length > 0 && lines[0].trim()) {
              return lines[0].trim();
            }
            parent = parent.parentElement;
          }
          return '';
        });
      }

      labelText = labelText.replace(/[\*\:\?]/g, '').trim();

      // Field type mapping
      let fieldType: FormFieldInfo['fieldType'] = 'text';
      const labelLower = labelText.toLowerCase();
      
      if (type === 'file' || labelLower.includes('resume') || labelLower.includes('cv')) {
        fieldType = 'file';
      } else if (type === 'email' || labelLower.includes('email')) {
        fieldType = 'email';
      } else if (type === 'tel' || labelLower.includes('phone') || labelLower.includes('mobile') || labelLower.includes('contact')) {
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
      const isRequired = requiredAttr !== null || labelLower.includes('required') || labelText.includes('*');

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

    // Try to find a logical submit button on the page
    let submitSelector = 'button[type="submit"], input[type="submit"]';
    const hasSubmit = await page.$(submitSelector);
    if (!hasSubmit) {
      // Find button containing submit-like text
      const buttons = await page.$$('button');
      for (const btn of buttons) {
        const txt = await btn.innerText();
        const cleanTxt = txt.toLowerCase();
        if (cleanTxt.includes('submit') || cleanTxt.includes('apply') || cleanTxt.includes('finish') || cleanTxt.includes('send')) {
          submitSelector = `button:has-text("${txt.trim()}")`;
          break;
        }
      }
    }

    return {
      fields,
      atsType: 'generic',
      submitSelector
    };
  }

  async fillField(page: Page, field: FormFieldInfo, value: string): Promise<boolean> {
    try {
      const selector = `[name="${field.fieldId}"], #${field.fieldId}, [placeholder="${field.fieldId}"]`;
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
      console.error(`Failed to fill Generic field ${field.label}:`, err);
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
      console.error('Generic resume upload failed:', err);
      return false;
    }
  }

  async detectValidationErrors(page: Page): Promise<string[]> {
    return await page.evaluate(() => {
      const errors: string[] = [];
      const errorElms = document.querySelectorAll('.error, .alert-danger, [aria-invalid="true"]');
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
