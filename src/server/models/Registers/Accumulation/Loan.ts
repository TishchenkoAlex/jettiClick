import { RegisterAccumulation, JRegisterAccumulation } from './RegisterAccumulation';
import { Ref, Props } from '../../document';

@JRegisterAccumulation({
  type: 'Register.Accumulation.Loan',
  description: 'Расчеты по кредитам и депозитам'
})
export class RegisterAccumulationLoan extends RegisterAccumulation {

  @Props({ type: 'Catalog.Loan' })
  Loan: Ref = null;

  @Props({ type: 'Catalog.Counterpartie' })
  Counterpartie: Ref = null;

  @Props({ type: 'number' })
  Amount: number = null;

  @Props({ type: 'number' })
  AmountInBalance: number = null;

  constructor(kind: boolean, public data: {
    Loan: Ref,
    Counterpartie: Ref,
    Amount: number,
    AmountInBalance: number,
  }) {
    super(kind, data);
  }
}
