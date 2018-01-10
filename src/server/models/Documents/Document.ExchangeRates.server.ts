import { TX } from '../../db';
import { RegisterInfoExchangeRates } from '../Registers/Info/ExchangeRates';
import { ServerDocument } from '../ServerDocument';
import { PostResult } from './../post.interfaces';
import { DocumentExchangeRates } from './Document.ExchangeRates';

export class DocumentExchangeRatesServer extends DocumentExchangeRates implements ServerDocument {

  async onValueChanged(prop: string, value: any, tx: TX) {
    switch (prop) {
      case 'company':
        return {};
      default:
        return {};
    }
  }

  async onCommand(command: string, args: any, tx: TX) {
    switch (command) {
      case 'company':
        return {};
      default:
        return {};
    }
  }

  async onPost(tx: TX) {
    const Registers: PostResult = { Account: [], Accumulation: [], Info: [] };
    for (const row of this.Rates) {
      Registers.Info.push(new RegisterInfoExchangeRates({
          currency: row.Currency,
          Rate: row.Rate
        }));
    }
    return Registers;
  }

}
