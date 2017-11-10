import { lib } from '../std.lib';
import { CalalogCompany } from './Catalog.Company';
import { IDocBase, RefValue, Ref, PatchValue, FileldsAction } from './doc.base';

export namespace CashIn {

  export interface IDoc extends IDocBase {
    doc: {
      currency: Ref,
      Amount: number
    }
  }

  const company_valueChanges = async (doc: IDocBase, value: RefValue) => {
    const company = await lib.doc.byId(value.id) as CalalogCompany;
    const currency = await lib.doc.formControlRef(company.doc.currency) as RefValue;
    return { currency: currency };
  }

  export const Actions: FileldsAction = {
    'company': company_valueChanges
  }

  const createFrom = async (source: IDocBase): Promise<IDocBase> => {
    const s = lib.doc.byId(source.id);
    return s;
  }

  export function post(doc: IDoc) {
    console.log('from namespace', doc.code);
  }

}
