import { lib } from '../std.lib';
import { CalalogCompany } from './Catalog.Company';
import { IDocBase, RefValue, Ref, PatchValue, FileldsAction } from './doc.base';

export namespace PriceList {

  export interface IDoc extends IDocBase {
    doc: {
      PriceType: Ref,
      TaxInclude: boolean,
      Items: {
        SKU: Ref,
        Unit: Ref,
        Price: number
      }[]
    }
  }

  const company_valueChanges = async (doc: PriceList.IDoc, value: RefValue): Promise<PatchValue> => {
    if (!value) { return {} }
    const company = await lib.doc.byId(value.id) as CalalogCompany;
    if (!company) { return {} }
    const currency = await lib.doc.formControlRef(company.doc.currency) as RefValue;
    return { currency: currency };
  }

  export const Actions: FileldsAction = {
    'company': company_valueChanges
  }

  export async function post(doc: PriceList.IDoc, Registers: { Account: any[], Accumulation: any[], Info: any[] }) {

    const PriceType = await lib.doc.byId(doc.doc.PriceType);
    for (let i = 0; i < doc.doc.Items.length; i++) {
      const row = doc.doc.Items[i];
      Registers.Info.push({
        type: 'PriceList',
        data: {
          currency: PriceType.doc.currency,
          PriceType: doc.doc.PriceType,
          Product: row.SKU,
          Price: row.Price,
          Unit: row.Unit
        }
      });
    }

  }
}
