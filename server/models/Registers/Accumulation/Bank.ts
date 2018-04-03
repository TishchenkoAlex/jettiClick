import { RegisterAccumulation, JRegisterAccumulation } from './RegisterAccumulation';
import { Ref, Props } from '../../document';

@JRegisterAccumulation({
  type: 'Register.Accumulation.Bank',
  description: 'Денежные средства безналичные'
})
export class RegisterAccumulationBank extends RegisterAccumulation {

  @Props({ type: 'Catalog.Currency', required: true })
  currency: Ref = null;

  @Props({ type: 'Catalog.BankAccount', required: true })
  BankAccount: Ref = null;

  @Props({ type: 'Catalog.CashFlow', required: true })
  CashFlow: Ref = null;

  @Props({ type: 'number' })
  Amount = 0;

  @Props({ type: 'number' })
  AmountInBalance = 0;

  constructor(kind: boolean, public data: {
    BankAccount: Ref,
    CashFlow: Ref,
    Amount: number,
    AmountInBalance: number,
  }) {
    super(kind, data);
  }
}
