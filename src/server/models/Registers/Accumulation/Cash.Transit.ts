import { RegisterAccumulation, JRegisterAccumulation } from './RegisterAccumulation';
import { Ref, Props } from '../../document';

@JRegisterAccumulation({
  type: 'Register.Accumulation.Cash.Transit',
  description: 'Денежные средства в пути'
})
export class RegisterAccumulationCashTransit extends RegisterAccumulation {

  @Props({ type: 'Catalog.Currency' })
  currency: Ref = null;

  @Props({ type: 'Types.Catalog' })
  Sender: Ref = null;

  @Props({ type: 'Types.Catalog' })
  Recipient: Ref = null;

  @Props({ type: 'Catalog.CashFlow' })
  CashFlow: Ref = null;

  @Props({ type: 'number' })
  Amount: number = null;

  @Props({ type: 'number' })
  AmountInBalance: number = null;

  constructor(kind: boolean, public data: {
    currency: Ref,
    Sender: Ref,
    Recipient: Ref,
    CashFlow: Ref,
    Amount: number,
    AmountInBalance: number,
  }) {
    super(kind, data);
  }
}
