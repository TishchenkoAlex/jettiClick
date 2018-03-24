import { RegisterAccumulation, JRegisterAccumulation } from './RegisterAccumulation';
import { Ref, Props } from '../../document';

@JRegisterAccumulation({
  type: 'Register.Accumulation.Balance',
  description: 'Активы/Пассивы'
})
export class RegisterAccumulationBalance extends RegisterAccumulation {
  @Props({ type: 'Catalog.Department' })
  Department: Ref = null;

  @Props({ type: 'Catalog.Balance' })
  Balance: Ref = null;

  @Props({ type: 'Types.Catalog' })
  Analytics: Ref = null;

  @Props({ type: 'number' })
  Amount: number = null;

  constructor(kind: boolean, public data: {
    Department: Ref,
    Balance: Ref,
    Analytics: Ref,
    Amount: number,
  }) {
    super(kind, data);
  }
}


