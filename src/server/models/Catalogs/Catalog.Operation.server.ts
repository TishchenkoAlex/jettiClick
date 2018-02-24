import { TX } from '../../db';
import { ServerDocument } from '../ServerDocument';
import { CatalogOperation } from './Catalog.Operation';

export class CatalogOperationServer extends CatalogOperation implements ServerDocument {

  async onCreate(tx: TX): Promise<void> {
    this.script = `/*
    const CashFlowRef = lib.doc.byCode('Catalog.CashFlow', 'IN.CUSTOMER');

    // Account
    Registers.Account.push({
        debit: { account: lib.account.byCode('50.01'), subcounts: [$.CashRegister, CashFlowRef] },
        kredit: { account: lib.account.byCode('62.01'), subcounts: [$.Customer] },
        sum: $.Amount
    });

    // Balance
    Registers.Accumulation.push({
        kind: false,
        type: "Register.Accumulation.Balance",
        data: {
            Department: $.Department,
            Balance: lib.doc.byCode('Catalog.Balance', 'AR'),
            Analytics: $.Customer,
            Amount: $.Amount / exchangeRate,
        }
    });

    Registers.Accumulation.push({
        kind: true,
        type: "Register.Accumulation.Balance",
        data: {
            Department: $.Department,
            Balance: lib.doc.byCode('Catalog.Balance', 'CASH'),
            Analytics: $.CashRegister,
            Amount: $.Amount / exchangeRate,
        }
    });

    // Register.Accumulation.AR
    Registers.Accumulation.push({
        kind: false,
        type: 'Register.Accumulation.AR',
        data: {
            AO: $.Invoice,
            Department: $.Department,
            Customer: $.Customer,
            AR: $.Amount,
            PayDay: doc.date,
            currency: $.currency,
            AmountInBalance: $.Amount / exchangeRate
        }
    });

    // Register.Accumulation.Cash
    Registers.Accumulation.push({
        kind: true,
        type: "Register.Accumulation.Cash",
        data: {
            Department: $.Department,
            CashRegister: $.CashRegister,
            CashFlow: CashFlowRef,
            Amount: $.Amount / exchangeRate
        }
    }); */
    `;
  }
}
