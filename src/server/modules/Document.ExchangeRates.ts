import { FileldsAction, IDocBase, PatchValue, Post, Ref, RefValue, TX } from './doc.base';

export namespace ExchangeRates {

  export interface IDoc extends IDocBase {
    doc: {
      Rates: {
        Currency: Ref,
        Rate: number,
      }[]
    }
  }

  const company_valueChanges = async (doc: IDoc, value: RefValue): Promise<PatchValue> => {
    return {};
  }

  export const Actions: FileldsAction = {
    // 'company': company_valueChanges
  }

  export const post: Post = async (doc: IDoc, Registers: { Account: any[], Accumulation: any[], Info: any[] }, tx: TX) => {

    for (const row of doc.doc.Rates) {
      Registers.Info.push({
        type: 'Register.Info.ExchangeRates',
        data: {
          currency: row.Currency,
          Rate: row.Rate
        }
      });
    }
  }
}
