import { db, TX } from '../../db';
import { ServerDocument, IServerDocument } from '../ServerDocument';
import { PostResult } from './../post.interfaces';
import { DocumentExchangeRates } from './Document.ExchangeRates';
import { RegisterInfoExchangeRates } from '../Registers/Info/ExchangeRates';
import { DocumentPriceList } from './Document.PriceList';
import { RegisterInfoPriceList } from '../Registers/Info/PriceList';
import { lib } from '../../std.lib';

export class DocumentPriceListServer extends DocumentPriceList implements ServerDocument {

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
    const priceType = await lib.doc.byId(this.PriceType, tx);
    for (const row of this.Items) {
      Registers.Info.push(new RegisterInfoPriceList({
        currency: priceType.doc.currency,
        PriceType: this.PriceType,
        Product: row.SKU,
        Price: row.Price,
        Unit: row.Unit
      }));
    }
  }

}
