import { RegisterAccumulation, JRegister } from './RegisterAccumulation';
import { Ref, Props } from '../../document';

@JRegister({
  type: 'Register.Accumulation.Balance',
  description: 'Активы/Пассивы'
})
export class RegisterAccumulationBalance extends RegisterAccumulation {
  @Props({ type: 'Catalog.Department' })
  Department: Ref = null;

  @Props({ type: 'Catalog.Balance' })
  Balance: Ref = null;

  @Props({ type: 'Catalog.Balance.Analytics' })
  Analytics: Ref = null;

  @Props({ type: 'number' })
  Amount: number = null;

  constructor(kind: boolean, public data: {
    Department: Ref,
    Balance: Ref,
    Analytics: Ref,
    Amount: number,
  }) {
    super(kind);
    if (data) {
      this.Department = data.Department;
      this.Balance = data.Balance;
      this.Analytics = data.Analytics;
      this.Amount = data.Amount;
    }
  }
}

