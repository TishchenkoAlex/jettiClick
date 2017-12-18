import { TX } from '../../db';
import { lib } from '../../std.lib';
import { RegisterInfoPriceList } from '../Registers/Info/PriceList';
import { IServerDocument, ServerDocument } from '../ServerDocument';
import { PostResult } from './../post.interfaces';
import { DocumentPriceList } from './Document.PriceList';
import { DocumentOperation } from './Document.Operation';

export class DocumentOperationServer extends DocumentOperation implements ServerDocument {

  async onValueChanged(prop: string, value: any, tx: TX) {
    switch (prop) {
      case 'company':
        if (!value) { return {} }
        const company = await lib.doc.byId<IServerDocument>(value.id, tx);
        if (!company) { return {} }
        const currency = await lib.doc.formControlRef(company.doc.currency, tx);
        return { currency: currency };
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

    const query = `SELECT (doc->>'script') script FROM "Documents" WHERE id = $1`;
    const Operation = await tx.oneOrNone(query, [this.Operation]);
    const exchangeRate = await lib.info.sliceLast('ExchangeRates', this.date, this.company, 'Rate', {currency: this.currency}, tx) || 1;
    let script = Operation.script.replace(/\$\./g, 'doc.');
    script = script.replace(/\lib\./g, 'await lib.');
    const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;
    const func = new AsyncFunction('doc, Registers, tx, lib, exchangeRate', script);
    await func(this, Registers, tx, lib, exchangeRate);
    return Registers;
  }

}
