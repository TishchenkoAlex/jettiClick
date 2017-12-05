import { db, TX } from '../../db';
import { IDocBase } from '../../modules/doc.base';
import { lib } from '../../std.lib';
import { IServerDocument, ServerDocument } from '../ServerDocument';
import { PostResult } from './../post.interfaces';
import {
    RegisterAccumulationAR,
    RegisterAccumulationBalance,
    RegisterAccumulationInventory,
    RegisterAccumulationSales,
} from './../Register.Accumulation';
import { DocumentInvoice } from './Document.Invoice';

export class DocumentInvoiceServer extends DocumentInvoice implements ServerDocument {

  map(document: IServerDocument) {
    if (document) {
       const {doc, ...header} = document;
       Object.assign(this, header, doc);
    }
  }

  async onValueChanged (prop: string, value: any, tx: TX = db) {
    switch (prop) {
      case 'company':
        if (!value) { return {} }
        const company = await lib.doc.byId<IDocBase>(value.id, tx);
        if (!company) { return {} }
        const currency = await lib.doc.formControlRef(company.doc.currency, tx);
        return { currency: currency };
      default:
        return {}
    }
  };

  async onPost(Registers: PostResult, tx: TX = db) {
    const acc90 = await lib.account.byCode('90.01', tx);
    const acc41 = await lib.account.byCode('41.01', tx);
    const acc62 = await lib.account.byCode('62.01', tx);
    const ExpenseCOST = await lib.doc.byCode('Catalog.Expense', 'OUT.COST', tx);
    const IncomeSALES = await lib.doc.byCode('Catalog.Income', 'SALES', tx);

    // AR
    Registers.Accumulation.push(new RegisterAccumulationAR(true, {
      AO: this.id,
      Department: this.Department,
      Customer: this.Customer,
      AR: this.Amount,
      PayDay: this.PayDay,
      currency: this.currency
    }));

    Registers.Account.push({
      debit: { account: acc62, subcounts: [this.Customer] },
      kredit: { account: acc90, subcounts: [] },
      sum: this.Amount,
    });

    let totalCost = 0;
    for (const row of this.Items) {
      const avgSumma = await lib.register.avgCost(
        this.date.toJSON(), this.company, { SKU: row.SKU, Storehouse: this.Storehouse }, tx) * row.Qty;
      totalCost += avgSumma;

      // Account
      Registers.Account.push({
        debit: { account: acc90, subcounts: [] },
        kredit: { account: acc41, subcounts: [this.Storehouse, row.SKU], qty: row.Qty },
        sum: avgSumma,
      });

      Registers.Accumulation.push(new RegisterAccumulationInventory(false, {
        Expense: ExpenseCOST,
        Storehouse: this.Storehouse,
        SKU: row.SKU,
        Cost: avgSumma,
        Qty: row.Qty
      }));

      Registers.Accumulation.push(new RegisterAccumulationSales(true, {
        AO: this.id,
        Department: this.Department,
        Customer: this.Customer,
        Product: row.SKU,
        Manager: this.Manager,
        Storehouse: this.Storehouse,
        Qty: row.Qty,
        Amount: row.Amount,
        Cost: avgSumma,
        Discount: 0,
        Tax: row.Tax,
        currency: this.currency
      }));
    }

    Registers.Accumulation.push(new RegisterAccumulationBalance(true, {
      Department: this.Department,
      Balance: await lib.doc.byCode('Catalog.Balance', 'AR', tx),
      Analytics: this.Customer,
      Amount: this.Amount
    }));

    Registers.Accumulation.push(new RegisterAccumulationBalance(false, {
      Department: this.Department,
      Balance: await lib.doc.byCode('Catalog.Balance', 'INVENTORY', tx),
      Analytics: this.Storehouse,
      Amount: totalCost
    }));

    Registers.Accumulation.push(new RegisterAccumulationBalance(false, {
      Department: this.Department,
      Balance: await lib.doc.byCode('Catalog.Balance', 'PL', tx),
      Analytics: ExpenseCOST,
      Amount: totalCost
    }));

    Registers.Accumulation.push(new RegisterAccumulationBalance(false, {
      Department: this.Department,
      Balance: await lib.doc.byCode('Catalog.Balance', 'PL', tx),
      Analytics: IncomeSALES,
      Amount: this.Amount,
    }));
  }
}
