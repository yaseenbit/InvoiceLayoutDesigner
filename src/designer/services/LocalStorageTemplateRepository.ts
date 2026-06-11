import { v4 as uuidv4 } from 'uuid';
import { InvoiceTemplate } from '../types/template.types';
import { TemplateRepository } from './TemplateRepository';
import { validateTemplate } from './TemplateValidator';

const STORAGE_KEY = 'invoice_designer_templates';
const INDEX_KEY  = 'invoice_designer_template_index';

function readIndex(): string[] {
  try {
    return JSON.parse(localStorage.getItem(INDEX_KEY) || '[]');
  } catch {
    return [];
  }
}

function writeIndex(ids: string[]): void {
  localStorage.setItem(INDEX_KEY, JSON.stringify(ids));
}

function readTemplate(id: string): InvoiceTemplate | null {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}_${id}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeTemplate(template: InvoiceTemplate): void {
  localStorage.setItem(`${STORAGE_KEY}_${template.id}`, JSON.stringify(template));
}

function removeTemplate(id: string): void {
  localStorage.removeItem(`${STORAGE_KEY}_${id}`);
}

export const localStorageTemplateRepository: TemplateRepository = {
  async save(template) {
    const now = new Date().toISOString();
    const toSave: InvoiceTemplate = { ...template, updatedAt: now };
    writeTemplate(toSave);
    const index = readIndex();
    if (!index.includes(toSave.id)) {
      writeIndex([...index, toSave.id]);
    }
  },

  async get(id) {
    return readTemplate(id);
  },

  async list() {
    const index = readIndex();
    const templates: InvoiceTemplate[] = [];
    for (const id of index) {
      const t = readTemplate(id);
      if (t) templates.push(t);
    }
    return templates.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },

  async delete(id) {
    removeTemplate(id);
    writeIndex(readIndex().filter((i) => i !== id));
  },

  async duplicate(id) {
    const source = readTemplate(id);
    if (!source) throw new Error(`Template ${id} not found`);
    const now = new Date().toISOString();
    const copy: InvoiceTemplate = {
      ...source,
      id: uuidv4(),
      name: `${source.name} (Copy)`,
      createdAt: now,
      updatedAt: now,
    };
    writeTemplate(copy);
    writeIndex([...readIndex(), copy.id]);
    return copy;
  },

  async import(json) {
    const parsed = JSON.parse(json);
    const errors = validateTemplate(parsed);
    if (errors.length > 0) {
      throw new Error(`Invalid template: ${errors.join('; ')}`);
    }
    const now = new Date().toISOString();
    const template: InvoiceTemplate = { ...parsed, id: uuidv4(), updatedAt: now };
    writeTemplate(template);
    writeIndex([...readIndex(), template.id]);
    return template;
  },

  async export(id) {
    const t = readTemplate(id);
    if (!t) throw new Error(`Template ${id} not found`);
    return JSON.stringify(t, null, 2);
  },
};
