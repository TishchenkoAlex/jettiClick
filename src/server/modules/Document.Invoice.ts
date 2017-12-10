import { IDatabase, ITask } from 'pg-promise';

import { lib } from '../std.lib';
import { Company } from './Catalog.Company';
import { FileldsAction, PatchValue, Post, RefValue } from './doc.base';
import { Ref } from '../models/document';
import { IServerDocument } from './../models/ServerDocument';
import { TX } from '../db';

export namespace Invoice {

  export interface IDoc extends IServerDocument {
    doc: {
      Department: Ref,
      Manager: Ref,
      Customer: Ref;
      Storehouse: Ref,
      Status: string,
      currency: Ref,
      Amount: number,
      Tax: number,
      PayDay: string,
      Items: {
        Qty: number,
        Amount: number,
        SKU: Ref,
        Tax: number,
        Price: number,
        PriceType: Ref
      }[],
      Comments: {
        Date: string,
        User: Ref,
        Comment: string
      }[]
    }
  }

  const company_valueChanges = async (doc: IDoc, value: RefValue): Promise<PatchValue> => {
    if (!value) { return {} }
    const company = await lib.doc.byId<Company.IDoc>(value.id);
    if (!company) { return {} }
    const currency = await lib.doc.formControlRef(company.doc.currency) as RefValue;
    return { currency: currency };
  }

  export const Actions: FileldsAction = {
    'company': company_valueChanges
  }

  export const post: Post = async (doc: IDoc, Registers: { Account: any[], Accumulation: any[], Info: any[] }, tx: TX) => {

    const acc90 = await lib.account.byCode('90.01', tx);
    const acc41 = await lib.account.byCode('41.01', tx);
    const acc62 = await lib.account.byCode('62.01', tx);
    const ExpenseCOST = await lib.doc.byCode('Catalog.Expense', 'OUT.COST', tx);
    const IncomeSALES = await lib.doc.byCode('Catalog.Income', 'SALES', tx);

    // AR
    Registers.Accumulation.push({
      kind: true,
      type: 'Register.Accumulation.AR',
      data: {
        AO: doc.id,
        Department: doc.doc.Department,
        Customer: doc.doc.Customer,
        AR: doc.doc.Amount,
        PayDay: doc.doc.PayDay,
        currency: doc.doc.currency
      }
    });

    Registers.Account.push({
      debit: { account: acc62, subcounts: [doc.doc.Customer] },
      kredit: { account: acc90, subcounts: [] },
      sum: doc.doc.Amount,
    });

    let totalCost = 0;
    for (const row of doc.doc.Items) {
      const avgSumma = await lib.register.avgCost(doc.date, doc.company, { SKU: row.SKU, Storehouse: doc.doc.Storehouse }, tx) * row.Qty;
      totalCost += avgSumma;

      // Account
      Registers.Account.push({
        debit: { account: acc90, subcounts: [] },
        kredit: { account: acc41, subcounts: [doc.doc.Storehouse, row.SKU], qty: row.Qty },
        sum: avgSumma,
      });

      // Inventory
      Registers.Accumulation.push({
        kind: false,
        type: 'Register.Accumulation.Inventory',
        data: {
          Expense: ExpenseCOST,
          Storehouse: doc.doc.Storehouse,
          SKU: row.SKU,
          Cost: avgSumma,
          Qty: row.Qty
        }
      });

      // SALES
      Registers.Accumulation.push({
        kind: true,
        type: 'Register.Accumulation.Sales',
        data: {
          AO: doc.id,
          Department: doc.doc.Department,
          Customer: doc.doc.Customer,
          Product: row.SKU,
          Manager: doc.doc.Manager,
          Storehouse: doc.doc.Storehouse,
          Qty: row.Qty,
          Amount: row.Amount,
          Cost: avgSumma,
          Discount: 0,
          Tax: row.Tax,
          currency: doc.doc.currency
        }
      });
    }

    // Balance
    Registers.Accumulation.push({
      kind: true,
      type: 'Register.Accumulation.Balance',
      data: {
        Department: doc.doc.Department,
        Balance: await lib.doc.byCode('Catalog.Balance', 'AR', tx),
        Analytics: doc.doc.Customer,
        Amount: doc.doc.Amount
      }
    });

    Registers.Accumulation.push({
      kind: false,
      type: 'Register.Accumulation.Balance',
      data: {
        Department: doc.doc.Department,
        Balance: await lib.doc.byCode('Catalog.Balance', 'INVENTORY', tx),
        Analytics: doc.doc.Storehouse,
        Amount: totalCost
      }
    });

    Registers.Accumulation.push({
      kind: true,
      type: 'Register.Accumulation.Balance',
      data: {
        Department: doc.doc.Department,
        Balance: await lib.doc.byCode('Catalog.Balance', 'PL', tx),
        Analytics: ExpenseCOST,
        Amount: totalCost
      }
    });

    Registers.Accumulation.push({
      kind: false,
      type: 'Register.Accumulation.Balance',
      data: {
        Department: doc.doc.Department,
        Balance: await lib.doc.byCode('Catalog.Balance', 'PL', tx),
        Analytics: IncomeSALES,
        Amount: doc.doc.Amount
      }
    });

  }
}
