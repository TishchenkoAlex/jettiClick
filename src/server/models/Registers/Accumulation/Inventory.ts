import { Ref, Props } from '../../document';
import { JRegisterAccumulation, RegisterAccumulation } from './RegisterAccumulation';
import { RegisterAccumulationTypes } from './factory';

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

  @Props({ type: 'number' })
  Cost: number = null;

  @Props({ type: 'number' })
  Qty: number = null;

  constructor(kind: boolean, public data: {
    Expense: Ref,
    Storehouse: Ref,
    SKU: Ref,
    Cost: number,
    Qty: number,
  }) {
    super(kind, data);
  }
}
