import { RegisterAccumulation, JRegisterAccumulation } from './RegisterAccumulation';
import { Ref, Props } from '../../document';

@JRegisterAccumulation({
  type: 'Register.Accumulation.AccountablePersons',
  description: 'Расчеты с подотчетными'
})
export class RegisterAccumulationAccountablePersons extends RegisterAccumulation {

  @Props({ type: 'Catalog.Currency', required: true })
  currency: Ref = null;

  @Props({ type: 'Catalog.Person', required: true })
  Employee: Ref = null;

  @Props({ type: 'Catalog.CashFlow', required: true })
  CashFlow: Ref = null;

  @Props({ type: 'number' })
  Amount = 0;

  @Props({ type: 'number' })
  AmountInBalance = 0;

  constructor(kind: boolean, public data: {
    currency: Ref,
    Employee: Ref,
    CashFlow: Ref,
    Amount: number,
    AmountInBalance: number,
  }) {
    super(kind, data);
  }
}
