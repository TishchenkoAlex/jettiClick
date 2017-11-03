import { lib } from '../std.lib';
import { CalalogCompany } from './Catalog.Company';
import { FileldsAction, IDocBase, PatchValue, Ref, RefValue } from './doc.base';

export interface DocumentOperation extends IDocBase {
  doc: {
    Operation: Ref,
    currency: Ref,
    Amount: number
  }
}

const company_valueChanges = async (doc: DocumentOperation, value: RefValue): Promise<PatchValue> => {
  if (!value) { return {} }
  const company = await lib.doc.byId(value.id) as CalalogCompany;
  if (!company) { return {} }
  const currency = await lib.doc.formControlRef(company.doc.currency) as RefValue;
  return { currency: currency };
}

export const OperationActions: FileldsAction = {
  'company': company_valueChanges
}
