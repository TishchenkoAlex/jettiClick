import { CatalogCounterpartie } from '../../models/Catalogs/Catalog.Counterpartie';
import { DocumentBase } from '../../models/document';
import { MSSQL } from '../../mssql';
import { BatchRow, lib } from '../../std.lib';
import { createDocumentServer } from '../documents.factory.server';
import { RegisterAccumulationAR } from '../Registers/Accumulation/AR';
import { RegisterAccumulationBalance } from '../Registers/Accumulation/Balance';
import { RegisterAccumulationInventory } from '../Registers/Accumulation/Inventory';
import { RegisterAccumulationPL } from '../Registers/Accumulation/PL';
import { RegisterAccumulationSales } from '../Registers/Accumulation/Sales';
import { ServerDocument } from '../ServerDocument';
import { PostResult } from './../post.interfaces';
import { DocumentInvoice } from './Document.Invoice';

export class DocumentInvoiceServer extends DocumentInvoice implements ServerDocument {

  async GetPrice(args: any, tx: MSSQL): Promise<{ doc: DocumentBase, result: any }> {
    this.Amount = 0;
    for (const row of this.Items) {
      row.Price = 100;
      row.Amount = row.Qty * row.Price;
      this.Amount += row.Amount;
    }
    return { doc: this, result: {} };
  }

  async onValueChanged(prop: string, value: any, tx: MSSQL): Promise<{ [x: string]: any }> {
    switch (prop) {
      case 'company':
        if (!value) { return {}; }
        const company = await lib.doc.byId(value.id, tx);
        if (!company) { return {}; }
        const currency = await lib.doc.formControlRef(company['currency'], tx);
        this.currency = currency;
        return { currency: currency };
      default:
        return {};
    }
  }

  async onCommand(command: string, args: any, tx: MSSQL) {
    switch (command) {
      case 'company':
        return args;
      default:
        return {};
    }
  }

  async baseOn(docID: string, tx: MSSQL): Promise<DocumentBase> {
    const ISource = await lib.doc.byId(docID, tx);
    switch (ISource.type) {
      case 'Catalog.Counterpartie':
        const catalogCounterpartie = await createDocumentServer<CatalogCounterpartie>(ISource.type, ISource, tx);
        this.Customer = catalogCounterpartie.id;
        return this;
      default:
        return this;
    }
  }


  async onPost(tx: MSSQL): Promise<PostResult> {
    const Registers: PostResult = { Account: [], Accumulation: [], Info: [] };

    const acc90 = await lib.account.byCode('90.01', tx);
    const acc41 = await lib.account.byCode('41.01', tx);
    const acc62 = await lib.account.byCode('62.01', tx);
    const ExpenseCOST = await lib.doc.byCode('Catalog.Expense', 'OUT.COST', tx);
    const IncomeSALES = await lib.doc.byCode('Catalog.Income', 'SALES', tx);
    const PL = await lib.doc.byCode('Catalog.Balance', 'PL', tx);
    const AR = await lib.doc.byCode('Catalog.Balance', 'AR', tx);
    const INVENTORY = await lib.doc.byCode('Catalog.Balance', 'INVENTORY', tx);

    const exchangeRate = await lib.info.sliceLast('ExchangeRates', this.date, this.company, 'Rate', { currency: this.currency }, tx) || 1;

    // AR
    Registers.Accumulation.push(new RegisterAccumulationAR(true, {
      AO: this.id,
      Department: this.Department,
      Customer: this.Customer,
      AR: this.Amount,
      AmountInBalance: this.Amount / exchangeRate,
      PayDay: this.PayDay,
      currency: this.currency
    }));

    Registers.Account.push({
      debit: { account: acc62, subcounts: [this.Customer] },
      kredit: { account: acc90, subcounts: [] },
      sum: this.Amount,
    });

    let totalCost = 0;

    let batchRows: BatchRow[] = this.Items.map(r => <BatchRow>({
      SKU: r.SKU, Storehouse: this.Storehouse, Qty: r.Qty, Cost: 0, batch: null,
      res1: r.Amount, res2: r.Tax, res3: 0, res4: 0, res5: 0
    }));
    batchRows = await lib.inventory.batch(this.date, this.company, batchRows, tx);
    for (const row of batchRows) {

      Registers.Accumulation.push(new RegisterAccumulationInventory(false, {
        Expense: ExpenseCOST,
        Storehouse: this.Storehouse,
        batch: row.batch,
        SKU: row.SKU,
        Cost: row.Cost,
        Qty: row.Qty
      }));

      totalCost += row.Cost;

      // Account
      Registers.Account.push({
        debit: { account: acc90, subcounts: [] },
        kredit: { account: acc41, subcounts: [this.Storehouse, row.SKU], qty: row.Qty },
        sum: row.Cost,
      });

      Registers.Accumulation.push(new RegisterAccumulationSales(true, {
        AO: this.id,
        Department: this.Department,
        Customer: this.Customer,
        Product: row.SKU,
        Manager: this.Manager,
        Storehouse: this.Storehouse,
        Qty: row.Qty,
        Amount: row.res1 / exchangeRate,
        AmountInAR: row.res1,
        AmountInDoc: row.res1,
        Cost: row.Cost,
        Discount: 0,
        Tax: row.res2,
        currency: this.currency
      }));

      Registers.Accumulation.push(new RegisterAccumulationPL(true, {
        Department: this.Department,
        PL: IncomeSALES,
        Analytics: row.SKU,
        Amount: row.res1 / exchangeRate,
      }));

      Registers.Accumulation.push(new RegisterAccumulationPL(false, {
        Department: this.Department,
        PL: ExpenseCOST,
        Analytics: row.SKU,
        Amount: row.Cost,
      }));
    }

    Registers.Accumulation.push(new RegisterAccumulationBalance(true, {
      Department: this.Department,
      Balance: AR,
      Analytics: this.Customer,
      Amount: this.Amount / exchangeRate
    }));

    Registers.Accumulation.push(new RegisterAccumulationBalance(false, {
      Department: this.Department,
      Balance: INVENTORY,
      Analytics: this.Storehouse,
      Amount: totalCost
    }));

    Registers.Accumulation.push(new RegisterAccumulationBalance(true, {
      Department: this.Department,
      Balance: PL,
      Analytics: ExpenseCOST,
      Amount: totalCost
    }));

    Registers.Accumulation.push(new RegisterAccumulationBalance(false, {
      Department: this.Department,
      Balance: PL,
      Analytics: IncomeSALES,
      Amount: this.Amount / exchangeRate,
    }));

    return Registers;
  }

}
