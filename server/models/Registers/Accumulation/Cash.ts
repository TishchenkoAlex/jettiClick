import { Props, Ref } from '../../document';
import { JRegisterAccumulation, RegisterAccumulation } from './RegisterAccumulation';

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
  Amount = 0;

  @Props({ type: 'number' })
  AmountInBalance = 0;

  constructor(kind: boolean, public data: {
    CashRegister: Ref,
    CashFlow: Ref,
    Amount: number,
    AmountInBalance: number,
  }) {
    super(kind, data);
  }
}
