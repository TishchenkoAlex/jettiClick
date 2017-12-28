import { Props, Ref } from '../../document';
import { JRegisterAccumulation, RegisterAccumulation } from './RegisterAccumulation';

@JRegisterAccumulation({
  type: 'Register.Accumulation.AR',
  description: 'Расчеты с клиентами'
})
export class RegisterAccumulationAR extends RegisterAccumulation {
  @Props({ type: 'Catalog.Department' })
  Department: Ref = null;

  @Props({ type: 'Types.Document' })
  AO: Ref = null;

  @Props({ type: 'Catalog.Counterpartie' })
  Customer: Ref = null;

  @Props({ type: 'Catalog.Currency' })
  currency: Ref = null;

  @Props({ type: 'number' })
  AR: number = null;

  @Props({ type: 'datetime' })
  PayDay: string = null;

  constructor(kind: boolean, public data: {
    AO: Ref,
    Department: Ref,
    Customer: Ref,
    AR: number,
    PayDay: string,
    currency: Ref,
  }) {
    super(kind, data);
  }
}
