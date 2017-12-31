import { Props, Ref } from '../../document';
import { JRegisterAccumulation, RegisterAccumulation } from './RegisterAccumulation';

@JRegisterAccumulation({
  type: 'Register.Accumulation.AP',
  description: 'Расчеты с поставщиками'
})
export class RegisterAccumulationAP extends RegisterAccumulation {

  @Props({ type: 'Catalog.Currency' })
  currency: Ref = null;

  @Props({ type: 'Catalog.Department' })
  Department: Ref = null;

  @Props({ type: 'Types.Document' })
  AO: Ref = null;

  @Props({ type: 'Catalog.Counterpartie' })
  Supplier: Ref = null;

  @Props({ type: 'datetime' })
  PayDay: string = null;

  @Props({ type: 'number' })
  Amount: number = null;

  @Props({ type: 'number' })
  AmountInBalance: number = null;

  constructor(kind: boolean, public data: {
    currency: Ref,
    Department: Ref,
    Supplier: Ref,
    AO: Ref,
    PayDay: Date,
    Amount: number,
    AmountInBalance: number,
  }) {
    super(kind, data);
  }
}
