import { db, TX } from '../../db';
import { ServerDocument } from '../ServerDocument';
import { PostResult } from './../post.interfaces';
import { DocumentExchangeRates } from './Document.ExchangeRates';
import { RegisterInfoExchangeRates } from '../Registers/Info/ExchangeRates';

export class DocumentExchangeRatesServer extends DocumentExchangeRates implements ServerDocument {

  async onValueChanged(prop: string, value: any, tx: TX = db) {
    switch (prop) {
      case 'company':
        return {};
      default:
        return {}
    }
  };

  async onCommand(command: string, args: any, tx: TX = db) {
    switch (command) {
      case 'company':
        return {};
      default:
        return {}
    }
  };

  async onPost(Registers: PostResult, tx: TX = db) {
    for (const row of this.Rates) {
      Registers.Info.push(new RegisterInfoExchangeRates({
          currency: row.Currency,
          Rate: row.Rate
        }));
    }
  }

}
