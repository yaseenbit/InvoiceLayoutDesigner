import { InvoiceTemplate } from '../types/template.types';

export interface TemplateRepository {
  save(template: InvoiceTemplate): Promise<void>;
  get(id: string): Promise<InvoiceTemplate | null>;
  list(): Promise<InvoiceTemplate[]>;
  delete(id: string): Promise<void>;
  duplicate(id: string): Promise<InvoiceTemplate>;
  import(json: string): Promise<InvoiceTemplate>;
  export(id: string): Promise<string>;
}
