import { Props, Ref } from '../../document';
import { JRegisterAccumulation, RegisterAccumulation } from './RegisterAccumulation';

@JRegisterAccumulation({
  type: 'Register.Accumulation.Inventory',
  description: 'Товары на складах'
})
export class RegisterAccumulationInventory extends RegisterAccumulation {
  @Props({ type: 'Catalog.Expense' })
  Expense: Ref = null;

  @Props({ type: 'Catalog.Storehouse' })
  Storehouse: Ref = null;

  @Props({ type: 'Catalog.Product' })
  SKU: Ref = null;

  @Props({ type: 'Types.Document' })
  batch: Ref = null;

  @Props({ type: 'number' })
  Cost = 0;

  @Props({ type: 'number' })
  Qty = 0;

  constructor(kind: boolean, public data: {
    Expense: Ref,
    Storehouse: Ref,
    SKU: Ref,
    batch: Ref,
    Cost: number,
    Qty: number,
  }) {
    super(kind, data);
  }
}
