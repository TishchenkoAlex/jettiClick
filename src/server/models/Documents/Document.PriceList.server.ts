import { lib } from '../../std.lib';
import { RegisterInfoPriceList } from '../Registers/Info/PriceList';
import { ServerDocument } from '../ServerDocument';
import { PostResult } from './../post.interfaces';
import { DocumentPriceList } from './Document.PriceList';
import { TX } from '../../db';

export class DocumentPriceListServer extends DocumentPriceList implements ServerDocument {

  async onValueChanged(prop: string, value: any, tx: TX) {
    switch (prop) {
      case 'company':
        return {};
      default:
        return {}
    }
  };

  async onCommand(command: string, args: any, tx: TX) {
    switch (command) {
      case 'company':
        return {};
      default:
        return {}
    }
  };

  async onPost(tx: TX) {
    const Registers: PostResult = { Account: [], Accumulation: [], Info: [] };

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
    return Registers;
  }

}
