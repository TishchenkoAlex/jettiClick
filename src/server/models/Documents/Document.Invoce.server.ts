import { TX } from '../../db';
import { lib } from '../../std.lib';
import { RegisterAccumulationAR } from '../Registers/Accumulation/AR';
import { RegisterAccumulationBalance } from '../Registers/Accumulation/Balance';
import { RegisterAccumulationInventory } from '../Registers/Accumulation/Inventory';
import { RegisterAccumulationSales } from '../Registers/Accumulation/Sales';
import { IServerDocument, ServerDocument } from '../ServerDocument';
import { PostResult } from './../post.interfaces';
import { DocumentInvoice, DocumentInvoiceItem, DocumentInvoiceComment } from './Document.Invoice';

export class DocumentInvoiceServer extends DocumentInvoice implements ServerDocument {

  async GetPrice(args, tx: TX) {
    this.Amount = 0;
    for (const row of this.Items) {
      row.Price = 100;
      row.Amount = row.Qty * row.Price;
      this.Amount += row.Amount;
    }
    return { doc: this, result: {} }
  }

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
        return args;
      default:
        return {}
    }
  };

  async onPost(tx: TX): Promise<PostResult> {
    const Registers: PostResult = { Account: [], Accumulation: [], Info: [] };

    const params = await Promise.all([
      lib.account.byCode('90.01', tx), // 0
      lib.account.byCode('41.01', tx), // 1
      lib.account.byCode('62.01', tx), // 2
      lib.doc.byCode('Catalog.Expense', 'OUT.COST', tx), // 3
      lib.doc.byCode('Catalog.Income', 'SALES', tx), // 4
      lib.doc.byCode('Catalog.Balance', 'AR', tx), // 5
      lib.doc.byCode('Catalog.Balance', 'INVENTORY', tx), // 6
      lib.doc.byCode('Catalog.Balance', 'PL', tx) // 7
    ]);

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
      debit: { account: params[2], subcounts: [this.Customer] },
      kredit: { account: params[0], subcounts: [] },
      sum: this.Amount,
    });

    let totalCost = 0;
    for (const row of this.Items) {
      const avgSumma = await lib.register.avgCost(
        this.date, this.company, { SKU: row.SKU, Storehouse: this.Storehouse }, tx) * row.Qty;
      totalCost += avgSumma;

      // Account
      Registers.Account.push({
        debit: { account: params[0], subcounts: [] },
        kredit: { account: params[1], subcounts: [this.Storehouse, row.SKU], qty: row.Qty },
        sum: avgSumma,
      });

      Registers.Accumulation.push(new RegisterAccumulationInventory(false, {
        Expense: params[3],
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
      Balance: params[5],
      Analytics: this.Customer,
      Amount: this.Amount
    }));

    Registers.Accumulation.push(new RegisterAccumulationBalance(false, {
      Department: this.Department,
      Balance: params[6],
      Analytics: this.Storehouse,
      Amount: totalCost
    }));

    Registers.Accumulation.push(new RegisterAccumulationBalance(true, {
      Department: this.Department,
      Balance: params[7],
      Analytics: params[3],
      Amount: totalCost
    }));

    Registers.Accumulation.push(new RegisterAccumulationBalance(false, {
      Department: this.Department,
      Balance: params[7],
      Analytics: params[4],
      Amount: this.Amount,
    }));

    return Registers;
  }
}
