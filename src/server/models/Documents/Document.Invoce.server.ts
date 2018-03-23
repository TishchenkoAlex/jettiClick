import { TX } from '../../db';
import { RefValue } from '../../models/api';
import { CatalogCounterpartie } from '../../models/Catalogs/Catalog.Counterpartie';
import { configSchema } from '../../models/config';
import { DocumentBase, Ref } from '../../models/document';
import { lib, BatchRow } from '../../std.lib';
import { RegisterAccumulationAR } from '../Registers/Accumulation/AR';
import { RegisterAccumulationBalance } from '../Registers/Accumulation/Balance';
import { RegisterAccumulationInventory } from '../Registers/Accumulation/Inventory';
import { RegisterAccumulationSales } from '../Registers/Accumulation/Sales';
import { INoSqlDocument, ServerDocument } from '../ServerDocument';
import { PostResult } from './../post.interfaces';
import { DocumentInvoice } from './Document.Invoice';
import { RegisterAccumulationPL } from '../Registers/Accumulation/PL';

export class DocumentInvoiceServer extends DocumentInvoice implements ServerDocument {

  async GetPrice(args: any, tx: TX): Promise<{ doc: DocumentBase, result: any }> {
    this.Amount = 0;
    for (const row of this.Items) {
      row.Price = 100;
      row.Amount = row.Qty * row.Price;
      this.Amount += row.Amount;
    }
    return { doc: this, result: {} };
  }

  async onValueChanged(prop: string, value: any, tx: TX): Promise<{ [x: string]: any }> {
    switch (prop) {
      case 'company':
        if (!value) { return {}; }
        const company = await lib.doc.byId(value.id, tx);
        if (!company) { return {}; }
        const currency = await lib.doc.formControlRef(company.doc.currency, tx);
        this.currency = currency;
        return { currency: currency };
      default:
        return {};
    }
  }

  async onCommand(command: string, args: any, tx: TX) {
    switch (command) {
      case 'company':
        return args;
      default:
        return {};
    }
  }

  async baseOn(docID: string, tx: TX): Promise<DocumentBase> {
    const ISource = await lib.doc.byId(docID, tx);
    let documentInvoice = await tx.oneOrNone<DocumentInvoice>(`${configSchema.get(this.type).QueryNew}`);
    switch (ISource.type) {
      case 'Catalog.Counterpartie':
        const Counterpartie = await lib.doc.viewModelById<CatalogCounterpartie>(docID);
        const { id, code, date, type, description, user } = documentInvoice;
        documentInvoice = Object.assign(documentInvoice, Counterpartie, { id, code, date, type, description, user });
        documentInvoice.Customer = <RefValue>{ id: docID, code: ISource.code, type: ISource.type, value: ISource.description };
        const company = await lib.doc.byId(documentInvoice.company.id, tx);
        documentInvoice.currency = await lib.doc.formControlRef(company.doc.currency, tx);
        return documentInvoice;
      default:
        return documentInvoice;
    }
  }


  async onPost(tx: TX): Promise<PostResult> {
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
    for (const batchRow of batchRows) {

      Registers.Accumulation.push(new RegisterAccumulationInventory(false, {
        Expense: ExpenseCOST,
        Storehouse: this.Storehouse,
        batch: batchRow.batch,
        SKU: batchRow.SKU,
        Cost: batchRow.Cost,
        Qty: batchRow.Qty
      }));

      totalCost += batchRow.Cost;

      // Account
      Registers.Account.push({
        debit: { account: acc90, subcounts: [] },
        kredit: { account: acc41, subcounts: [this.Storehouse, batchRow.SKU], qty: batchRow.Qty },
        sum: batchRow.Cost,
      });

      Registers.Accumulation.push(new RegisterAccumulationSales(true, {
        AO: this.id,
        Department: this.Department,
        Customer: this.Customer,
        Product: batchRow.SKU,
        Manager: this.Manager,
        Storehouse: this.Storehouse,
        Qty: batchRow.Qty,
        Amount: batchRow.res1 / exchangeRate,
        AmountAR: batchRow.res1,
        AmountInDoc: batchRow.res1,
        Cost: batchRow.Cost,
        Discount: 0,
        Tax: batchRow.res2,
        currency: this.currency
      }));

      Registers.Accumulation.push(new RegisterAccumulationPL(true, {
        Department: this.Department,
        PL: IncomeSALES,
        Analytics: batchRow.SKU,
        Amount: batchRow.res1 / exchangeRate,
      }));

      Registers.Accumulation.push(new RegisterAccumulationPL(false, {
        Department: this.Department,
        PL: ExpenseCOST,
        Analytics: batchRow.SKU,
        Amount: batchRow.Cost,
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

async function onPostJS(document: INoSqlDocument, Registers = { Account: [], Accumulation: [], Info: [] }, tx: TX) {
  const { doc, ...header } = document;

  const acc90 = await lib.account.byCode('90.01', tx);
  const acc41 = await lib.account.byCode('41.01', tx);
  const acc62 = await lib.account.byCode('62.01', tx);
  const ExpenseCOST = await lib.doc.byCode('Catalog.Expense', 'OUT.COST', tx);
  const IncomeSALES = await lib.doc.byCode('Catalog.Income', 'SALES', tx);
  const PL = await lib.doc.byCode('Catalog.Balance', 'PL', tx);
  const AR = await lib.doc.byCode('Catalog.Balance', 'AR', tx);
  const INVENTORY = await lib.doc.byCode('Catalog.Balance', 'INVENTORY', tx);
  const exchangeRate = await lib.info.sliceLast('ExchangeRates', header.date, header.company, 'Rate', { currency: doc.currency }, tx) || 1;

  // AR
  Registers.Accumulation.push({
    kind: true,
    AO: header.id,
    Department: doc.Department,
    Customer: doc.Customer,
    AR: doc.Amount,
    AmountInBalance: doc.Amount / exchangeRate,
    PayDay: doc.PayDay,
    currency: doc.currency
  });

  Registers.Account.push({
    debit: { account: acc62, subcounts: [doc.Customer] },
    kredit: { account: acc90, subcounts: [] },
    sum: doc.Amount,
  });

  let totalCost = 0;
  for (const row of doc.Items) {
    const avgSumma = await lib.register.avgCost(
      doc.date, { company: doc.company, SKU: row.SKU, Storehouse: doc.Storehouse }, tx) * row.Qty;
    totalCost += avgSumma;

    // Account
    Registers.Account.push({
      debit: { account: acc90, subcounts: [] },
      kredit: { account: acc41, subcounts: [doc.Storehouse, row.SKU], qty: row.Qty },
      sum: avgSumma,
    });

    Registers.Accumulation.push({
      kind: false,
      Expense: ExpenseCOST,
      Storehouse: doc.Storehouse,
      SKU: row.SKU,
      Cost: avgSumma,
      Qty: row.Qty
    });

    Registers.Accumulation.push({
      kind: true,
      AO: header.id,
      Department: doc.Department,
      Customer: doc.Customer,
      Product: row.SKU,
      Manager: doc.Manager,
      Storehouse: doc.Storehouse,
      Qty: row.Qty,
      Amount: row.Amount,
      Cost: avgSumma,
      Discount: 0,
      Tax: row.Tax,
      currency: doc.currency
    });
  }

  Registers.Accumulation.push({
    kind: true,
    Department: doc.Department,
    Balance: AR,
    Analytics: doc.Customer,
    Amount: doc.Amount / exchangeRate
  });

  Registers.Accumulation.push({
    kind: false,
    Department: doc.Department,
    Balance: INVENTORY,
    Analytics: doc.Storehouse,
    Amount: totalCost
  });

  Registers.Accumulation.push({
    kind: true,
    Department: doc.Department,
    Balance: PL,
    Analytics: ExpenseCOST,
    Amount: totalCost
  });

  Registers.Accumulation.push({
    kind: false,
    Department: doc.Department,
    Balance: PL,
    Analytics: IncomeSALES,
    Amount: doc.Amount / exchangeRate,
  });

}
