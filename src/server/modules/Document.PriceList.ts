import { lib } from '../std.lib';
import { Company } from './Catalog.Company';
import { PriceType } from './Catalog.PriceType';
import { FileldsAction, IDocBase, PatchValue, Post, RefValue, TX } from './doc.base';
import { Ref } from '../models/document';

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

  const company_valueChanges = async (doc: IDoc, value: RefValue): Promise<PatchValue> => {
    if (!value) { return {} }
    const company = await lib.doc.byId<Company.IDoc>(value.id);
    if (!company) { return {} }
    const currency = await lib.doc.formControlRef(company.doc.currency) as RefValue;
    return { currency: currency };
  }

  export const Actions: FileldsAction = {
    'company': company_valueChanges
  }

  export const post: Post = async (doc: IDoc, Registers: { Account: any[], Accumulation: any[], Info: any[] }, tx: TX) => {

    const priceType = await lib.doc.byId<PriceType.IDoc>(doc.doc.PriceType, tx);
    for (const row of doc.doc.Items) {
      Registers.Info.push({
        type: 'Register.Info.PriceList',
        data: {
          currency: priceType.doc.currency,
          PriceType: doc.doc.PriceType,
          Product: row.SKU,
          Price: row.Price,
          Unit: row.Unit
        }
      });
    }
  }

}
