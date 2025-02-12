import { TemplatePublished } from './template-management';
import { ZodTypeAny } from 'zod';

export const schemas: Record<string, Record<string, ZodTypeAny>> = {
  'template-management:template-published': TemplatePublished
}
