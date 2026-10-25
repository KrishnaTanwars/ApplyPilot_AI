import { Page } from 'playwright';
import { ATSAdapter, FormScanResult, FormFieldInfo } from './types';

export class GreenhouseAdapter implements ATSAdapter {
  async detect(page: Page): Promise<boolean> {
    const hasForm = await page.$('#application_form');
    const isGreenhouseDomain = page.url().includes('boards.greenhouse.io');
    return !!(hasForm || isGreenhouseDomain);
  }

  async scanForm(page: Page): Promise<FormScanResult> {
    const fields: FormFieldInfo[] = [];

    // Select all inputs, textareas, selects inside application_form
    const container = await page.$('#application_form') || page.mainFrame();
    const elements = await container.$$('input, textarea, select');

    for (const el of elements) {
      const type = await el.getAttribute('type') || '';
      const name = await el.getAttribute('name') || '';
      const id = await el.getAttribute('id') || '';
      const tagName = await el.evaluate(e => e.tagName.toLowerCase());

      // Skip hidden inputs and submit buttons
      if (type === 'hidden' || type === 'submit' || type === 'button' || type === 'image') {
        continue;
      }

      // Skip duplicate scans if we match checkbox/radio inputs with the same name
      if ((type === 'checkbox' || type === 'radio') && fields.some(f => f.fieldId === name)) {
        continue;
      }

      // Try to find label text
      let labelText = '';
      if (id) {
        const labelEl = await page.$(`label[for="${id}"]`);
        if (labelEl) {
          labelText = await labelEl.innerText() || '';
        }
      }
      if (!labelText) {
        // Search parent structure for text
        labelText = await el.evaluate(node => {
          let parent = node.parentElement;
          for (let i = 0; i < 3; i++) {
            if (!parent) break;
            const text = parent.innerText || '';
            const cleanText = text.replace(/[\*\r\n]/g, '').trim();
            if (cleanText) return cleanText.split('\n')[0]; // take first line
            parent = parent.parentElement;
          }
          return '';
        });
      }

      // Clean label
      labelText = labelText.replace(/[\*\:\?]/g, '').trim();

      // Detect fieldType
      let fieldType: FormFieldInfo['fieldType'] = 'text';
      if (type === 'file') {
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

      // Determine required status
      const requiredAttr = await el.getAttribute('required');
      const ariaRequired = await el.getAttribute('aria-required');
      const isRequired = requiredAttr !== null || ariaRequired === 'true' || labelText.includes('required') || labelText.includes('*');

      // Get select options
      let options: string[] = [];
      if (fieldType === 'select') {
        const optionElms = await el.$$('option');
        for (const opt of optionElms) {
          const val = await opt.innerText();
          if (val.trim()) options.push(val.trim());
        }
      } else if (fieldType === 'radio' || fieldType === 'checkbox') {
        // Collect option values for groups sharing the same name
        const groupElms = await page.$$(`input[name="${name}"]`);
        const groupOptions: string[] = [];
        for (const grp of groupElms) {
          const optVal = await grp.getAttribute('value') || '';
          // Try to find label for this specific radio option
          const grpId = await grp.getAttribute('id') || '';
          let optLabel = optVal;
          if (grpId) {
            const lbl = await page.$(`label[for="${grpId}"]`);
            if (lbl) {
              optLabel = await lbl.innerText();
            }
          }
          groupOptions.push(optLabel.trim());
        }
        options = groupOptions;
      }

      const fieldId = name || id;
      if (fieldId && !fields.some(f => f.fieldId === fieldId)) {
        fields.push({
          fieldId,
          label: labelText || fieldId,
          normalizedLabel: labelText.toLowerCase().replace(/[^a-z0-9]/g, '').trim(),
          fieldType,
          required: isRequired,
          options: options.length > 0 ? options : undefined
        });
      }
    }

    return {
      fields,
      atsType: 'greenhouse',
      submitSelector: '#submit_app'
    };
  }

  async fillField(page: Page, field: FormFieldInfo, value: string): Promise<boolean> {
    try {
      const selector = `[name="${field.fieldId}"], #${field.fieldId}`;
      const el = await page.$(selector);
      if (!el) return false;

      if (field.fieldType === 'select') {
        // Find best match among options
        const options = field.options || [];
        const match = options.find(o => o.toLowerCase().includes(value.toLowerCase()) || value.toLowerCase().includes(o.toLowerCase())) || options[0];
        if (match) {
          await page.selectOption(selector, { label: match });
        }
      } else if (field.fieldType === 'radio') {
        // Find radio button with matching label
        const radios = await page.$$(`input[name="${field.fieldId}"]`);
        for (const radio of radios) {
          const radioId = await radio.getAttribute('id') || '';
          let radioLabelText = '';
          if (radioId) {
            const label = await page.$(`label[for="${radioId}"]`);
            if (label) {
              radioLabelText = await label.innerText();
            }
          }
          if (radioLabelText.toLowerCase().includes(value.toLowerCase()) || value.toLowerCase().includes(radioLabelText.toLowerCase())) {
            await radio.click();
            break;
          }
        }
      } else if (field.fieldType === 'checkbox') {
        // Check if value is truthy (like 'yes', 'true', 'checked')
        const shouldCheck = ['yes', 'true', '1', 'checked'].includes(value.toLowerCase());
        const isChecked = await el.isChecked();
        if (shouldCheck !== isChecked) {
          await el.click();
        }
      } else {
        // Standard text inputs
        await el.fill('');
        await el.type(value, { delay: 30 });
      }
      return true;
    } catch (err) {
      console.error(`Failed to fill Greenhouse field ${field.label}:`, err);
      return false;
    }
  }

  async uploadResume(page: Page, fileInputSelector: string, filePath: string): Promise<boolean> {
    try {
      // Greenhouse file input can be targetted by selector name/id or input[type="file"]
      const fileInput = await page.$(fileInputSelector) || await page.$('input[type="file"][name*="resume"]');
      if (!fileInput) return false;
      await fileInput.setInputFiles(filePath);
      // Wait a second for uploading animation to start/finish
      await page.waitForTimeout(1500);
      return true;
    } catch (err) {
      console.error('Greenhouse resume upload failed:', err);
      return false;
    }
  }

  async detectValidationErrors(page: Page): Promise<string[]> {
    return await page.evaluate(() => {
      const errors: string[] = [];
      const errorElements = document.querySelectorAll('.field-error, .error, [aria-invalid="true"]');
      errorElements.forEach(el => {
        const text = el.textContent?.trim();
        if (text) errors.push(text);
      });
      return errors;
    });
  }

  async detectCaptcha(page: Page): Promise<boolean> {
    return await page.evaluate(() => {
      const hasRecaptcha = !!document.querySelector('.g-recaptcha, iframe[src*="recaptcha"], iframe[src*="hcaptcha"]');
      return hasRecaptcha;
    });
  }
}
