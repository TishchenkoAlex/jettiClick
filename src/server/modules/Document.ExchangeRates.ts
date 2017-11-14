import { lib } from '../std.lib';
import { CalalogCompany } from './Catalog.Company';
import { IDocBase, RefValue, Ref, PatchValue, FileldsAction } from './doc.base';
import { ITask, IDatabase } from 'pg-promise';

export namespace ExchangeRates {

  export interface IDoc extends IDocBase {
    doc: {
      Rates: {
        Currency: Ref,
        Rate: number,
      }[]
    }
  }

  const company_valueChanges = async (doc: ExchangeRates.IDoc, value: RefValue): Promise<PatchValue> => {
    return {};
  }

  export const Actions: FileldsAction = {
    'company': company_valueChanges
  }

  export async function post(doc: ExchangeRates.IDoc, Registers: { Account: any[], Accumulation: any[], Info: any[] },
    tx: ITask<any> | IDatabase<any>) {

    for (const row of doc.doc.Rates) {
      Registers.Info.push({
        type: 'ExchangeRates',
        data: {
          currency: row.Currency,
          Rate: row.Rate
        }
      });
    }
  }
}
