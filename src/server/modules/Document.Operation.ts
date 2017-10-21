import { lib } from '../std.lib';
import { CalalogCompany } from './Catalog.Company';
import { DocBase, RefValue, Ref, PatchValue, FileldsAction } from './doc.base';

export interface DocumentOperation extends DocBase {
  doc: {
    Operation: Ref,
    currency: Ref,
    Amount: number
  }
}

const company_valueChanges = async (doc: DocumentOperation, value: RefValue): Promise<PatchValue> => {
  const company = await lib.doc.byId(value.id) as CalalogCompany;
  const currency = await lib.doc.formControlRef(company.doc.currency) as RefValue;
  return { currency: currency };
}

export const OperationActions: FileldsAction = {
  'company': company_valueChanges
}
