import { TX } from '../../db';
import { lib } from '../../std.lib'
import { DocumentInvoice } from './Document.Invoice';
import { PostResult } from './../post.interfaces';
import {
    RegisterAccumulationAR,
    RegisterAccumulationBalance,
    RegisterAccumulationInventory,
    RegisterAccumulationSales,
} from './../Register.Accumulation';

const OnPost = async (doc: DocumentInvoice, Registers: PostResult, tx: TX) => {
  const acc90 = await lib.account.byCode('90.01', tx);
  const acc41 = await lib.account.byCode('41.01', tx);
  const acc62 = await lib.account.byCode('62.01', tx);
  const ExpenseCOST = await lib.doc.byCode('Catalog.Expense', 'OUT.COST', tx);
  const IncomeSALES = await lib.doc.byCode('Catalog.Income', 'SALES', tx);

  // AR
  Registers.Accumulation.push(new RegisterAccumulationAR(true, {
    AO: doc.id,
    Department: doc.Department,
    Customer: doc.Customer,
    AR: doc.Amount,
    PayDay: doc.PayDay,
    currency: doc.currency
  }));

  Registers.Account.push({
    debit: { account: acc62, subcounts: [doc.Customer] },
    kredit: { account: acc90, subcounts: [] },
    sum: doc.Amount,
  });

  let totalCost = 0;
  for (const row of doc.Items) {
    const avgSumma = await lib.register.avgCost(doc.date.toJSON(), doc.company, { SKU: row.SKU, Storehouse: doc.Storehouse }, tx) * row.Qty;
    totalCost += avgSumma;

    // Account
    Registers.Account.push({
      debit: { account: acc90, subcounts: [] },
      kredit: { account: acc41, subcounts: [doc.Storehouse, row.SKU], qty: row.Qty },
      sum: avgSumma,
    });

    Registers.Accumulation.push(new RegisterAccumulationInventory(false, {
      Expense: ExpenseCOST,
      Storehouse: doc.Storehouse,
      SKU: row.SKU,
      Cost: avgSumma,
      Qty: row.Qty
    }));

    Registers.Accumulation.push(new RegisterAccumulationSales(true, {
      AO: doc.id,
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
    }));
  }

  Registers.Accumulation.push(new RegisterAccumulationBalance(true, {
    Department: doc.Department,
    Balance: await lib.doc.byCode('Catalog.Balance', 'AR', tx),
    Analytics: doc.Customer,
    Amount: doc.Amount
  }));

  Registers.Accumulation.push(new RegisterAccumulationBalance(false, {
    Department: doc.Department,
    Balance: await lib.doc.byCode('Catalog.Balance', 'INVENTORY', tx),
    Analytics: doc.Storehouse,
    Amount: totalCost
  }));

  Registers.Accumulation.push(new RegisterAccumulationBalance(false, {
    Department: doc.Department,
    Balance: await lib.doc.byCode('Catalog.Balance', 'PL', tx),
    Analytics: ExpenseCOST,
    Amount: totalCost
  }));

  Registers.Accumulation.push(new RegisterAccumulationBalance(false, {
    Department: doc.Department,
    Balance: await lib.doc.byCode('Catalog.Balance', 'PL', tx),
    Analytics: IncomeSALES,
    Amount: doc.Amount,
  }));
}


