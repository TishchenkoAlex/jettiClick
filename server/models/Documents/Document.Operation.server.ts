import { TX } from '../../db';
import { MSSQL } from '../../mssql';
import { lib } from '../../std.lib';
import { RefValue } from '../api';
import { createDocumentServer } from '../documents.factory.server';
import { RegisterAccumulationInventory } from '../Registers/Accumulation/Inventory';
import { ServerDocument } from '../ServerDocument';
import { JQueue } from '../Tasks/tasks';
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

  async onPost(tx: MSSQL) {
    const Registers: PostResult = { Account: [], Accumulation: [], Info: [] };

    const query = `SELECT JSON_VALUE(doc, '$.script') script FROM "Documents" WHERE id = '${this.Operation}'`;
    const Operation = await tx.oneOrNone<{ script: string }>(query);
    const exchangeRate = await lib.info.sliceLast('ExchangeRates', this.date, this.company, 'Rate', { currency: this.currency }, tx) || 1;
    const script = `
      let AmountInBalance = doc.Amount / exchangeRate;
      ${ Operation.script
        .replace(/\$\./g, 'doc.')
        .replace(/tx\./g, 'await tx.')
        .replace(/lib\./g, 'await lib.')
        .replace(/\'doc\./g, '\'$.')}
    `;
    const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;
    const func = new AsyncFunction('doc, Registers, tx, lib, exchangeRate', script);
    await func(this, Registers, tx, lib, exchangeRate);

    const Inventory = Registers.Accumulation
      .filter(r => r.type === 'Register.Accumulation.Inventory' && r.kind === true) as RegisterAccumulationInventory[];
    if (!Inventory.length) return Registers;

    await JQueue.add({
      job: { id: 'cost', description: `${this.description}` },
      doc: this,
      Inventory,
    });
    return Registers;
  }

  async baseOn(docId: string, tx: TX) {
    const rawDoc = await lib.doc.byId(docId, tx);
    const sourceDoc = await createDocumentServer(rawDoc.type, rawDoc, tx, true);

    if (sourceDoc instanceof DocumentOperation) {
      const sourceOperationID = (sourceDoc.Operation as RefValue).id;
      const OperationID = (this.Operation as RefValue).id;
      const rawOperation = await lib.doc.byId(sourceOperationID, tx);
      const Rule = rawOperation.doc.CopyTo.find(c => c.Operation === OperationID);
      if (Rule) {
        const script = `
        this.company = doc.company;
        this.currency = doc.currency;
        this.parent = {id: doc.id, type: doc.type, value: doc.description, code: doc.code};
        ${ Rule.script
            .replace(/\$\./g, 'doc.')
            .replace(/tx\./g, 'await tx.')
            .replace(/lib\./g, 'await lib.')
            .replace(/\'doc\./g, '\'$.')}
      `;
        const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;
        const func = new AsyncFunction('doc, tx, lib', script) as Function;
        await func.bind(this, sourceDoc, tx, lib)();
      }
    } else {
      switch (sourceDoc.type) {
        case 'Catalog.Counterpartie':
          break;
        default:
          break;
      }
    }
    return this;
  }

}
