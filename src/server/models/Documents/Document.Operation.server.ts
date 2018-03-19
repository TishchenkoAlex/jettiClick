import { TX } from '../../db';
import { lib } from '../../std.lib';
import { ServerDocument } from '../ServerDocument';
import { PostResult } from './../post.interfaces';
import { DocumentOperation } from './Document.Operation';

export class DocumentOperationServer extends DocumentOperation implements ServerDocument {

  async onValueChanged(prop: string, value: any, tx: TX) {
    if (!value) { return {}; }
    switch (prop) {
      case 'company':
        const company = await lib.doc.byId(value.id, tx);
        if (!company) { return {}; }
        const currency = await lib.doc.formControlRef(company.doc.currency, tx);
        return { currency };
      case 'Operation':
        const Operation = await lib.doc.byId(value.id, tx);
        if (!Operation) { return {}; }
        const Group = await lib.doc.formControlRef(Operation.doc.Group, tx);
        return { Group };
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

    const query = `SELECT JSON_VALUE(doc, '$.script') script FROM "Documents" WHERE id = @p1`;
    const Operation = await tx.oneOrNone<{ script: string }>(query, [this.Operation]);
    const exchangeRate = await lib.info.sliceLast('ExchangeRates', this.date, this.company, 'Rate', { currency: this.currency }, tx) || 1;
    const script = `
      let AmountInBalance = doc.Amount / exchangeRate;
      ${ Operation.script.replace(/\$\./g, 'doc.').replace(/\lib\./g, 'await lib.')}`;
    const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;
    const func = new AsyncFunction('doc, Registers, tx, lib, exchangeRate', script);
    await func(this, Registers, tx, lib, exchangeRate);
    return Registers;
  }

}
