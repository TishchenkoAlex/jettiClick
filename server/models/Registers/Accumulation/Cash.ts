import { RegisterAccumulation, JRegisterAccumulation } from './RegisterAccumulation';
import { Ref, Props } from '../../document';

@JRegisterAccumulation({
  type: 'Register.Accumulation.Cash',
  description: 'Денежные средства наличные'
})
export class RegisterAccumulationCash extends RegisterAccumulation {

  @Props({ type: 'Catalog.CashRegister' })
  CashRegister: Ref = null;

  @Props({ type: 'Catalog.CashFlow' })
  CashFlow: Ref = null;

  @Props({ type: 'number' })
  Amount: number = null;

  @Props({ type: 'number' })
  AmountInBalance: number = null;

  constructor(kind: boolean, public data: {
    CashRegister: Ref,
    CashFlow: Ref,
    Amount: number,
    AmountInBalance: number,
  }) {
    super(kind, data);
  }
}
