import { RegisterAccumulation, JRegisterAccumulation } from './RegisterAccumulation';
import { Ref, Props } from '../../document';

@JRegisterAccumulation({
  type: 'Register.Accumulation.Bank',
  description: 'Денежные средства безналичные'
})
export class RegisterAccumulationBank extends RegisterAccumulation {

  @Props({ type: 'Catalog.BankAccount' })
  BankAccount: Ref = null;

  @Props({ type: 'Catalog.CashFlow' })
  CashFlow: Ref = null;

  @Props({ type: 'number' })
  Amount: number = null;

  @Props({ type: 'number' })
  AmountInBalance: number = null;

  constructor(kind: boolean, public data: {
    BankAccount: Ref,
    CashFlow: Ref,
    Amount: number,
    AmountInBalance: number,
  }) {
    super(kind, data);
  }
}
