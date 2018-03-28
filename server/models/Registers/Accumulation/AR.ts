import { Props, Ref } from '../../document';
import { JRegisterAccumulation, RegisterAccumulation } from './RegisterAccumulation';

@JRegisterAccumulation({
  type: 'Register.Accumulation.AR',
  description: 'Расчеты с клиентами'
})
export class RegisterAccumulationAR extends RegisterAccumulation {

  @Props({ type: 'Catalog.Currency' })
  currency: Ref = null;

  @Props({ type: 'Catalog.Department' })
  Department: Ref = null;

  @Props({ type: 'Types.Document' })
  AO: Ref = null;

  @Props({ type: 'Catalog.Counterpartie' })
  Customer: Ref = null;

  @Props({ type: 'datetime' })
  PayDay = new Date();

  @Props({ type: 'number' })
  AR = 0;

  @Props({ type: 'number' })
  AmountInBalance = 0;

  constructor(kind: boolean, public data: {
    currency: Ref,
    Department: Ref,
    Customer: Ref,
    AO: Ref,
    PayDay: Date,
    AR: number,
    AmountInBalance: number,
  }) {
    super(kind, data);
  }
}
