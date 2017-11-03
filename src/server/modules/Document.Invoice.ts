import { lib } from '../std.lib';
import { CalalogCompany } from './Catalog.Company';
import { IDocBase, RefValue, Ref, PatchValue, FileldsAction } from './doc.base';

export interface IDocumentInvoice extends IDocBase {
  doc: {
    Manager: Ref,
    Customer: Ref;
    Storehouse: Ref,
    Status: string,
    currency: Ref,
    Amount: number,
    Tax: number,
    Items: {
      Qty: number,
      Amount: number,
      SKU: Ref,
      Tax: number,
      Price: number,
      PriceType: Ref
    }[],
    Comments: {
      Date: string,
      User: Ref,
      Comment: string
    }[]
  }
}

const company_valueChanges = async (doc: IDocumentInvoice, value: RefValue): Promise<PatchValue> => {
  if (!value) { return {} }
  const company = await lib.doc.byId(value.id) as CalalogCompany;
  const currency = await lib.doc.formControlRef(company.doc.currency) as RefValue;
  return { currency: currency };
}

export const OperationActions: FileldsAction = {
  'company': company_valueChanges
}
