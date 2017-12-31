import { Ref, Props } from '../../document';
import { JRegisterAccumulation, RegisterAccumulation } from './RegisterAccumulation';
import { RegisterAccumulationTypes } from './factory';

@JRegisterAccumulation({
  type: 'Register.Accumulation.Sales',
  description: 'Выручка и себестоимость продаж'
})
export class RegisterAccumulationSales extends RegisterAccumulation {

  @Props({ type: 'Catalog.Currency' })
  currency: Ref = null;

  @Props({ type: 'Catalog.Department' })
  Department: Ref = null;

  @Props({ type: 'Catalog.Counterpartie' })
  Customer: Ref = null;

  @Props({ type: 'Catalog.Product' })
  Product: Ref = null;

  @Props({ type: 'Catalog.Manager' })
  Manager: Ref = null;

  @Props({ type: 'Types.Document' })
  AO: Ref = null;

  @Props({ type: 'Catalog.Storehouse' })
  Storehouse: Ref = null;

  @Props({ type: 'number' })
  Cost: number = null;

  @Props({ type: 'number' })
  Qty: number = null;

  @Props({ type: 'number' })
  Amount: number = null;

  @Props({ type: 'number' })
  Discount: number = null;

  @Props({ type: 'number' })
  Tax: number = null;

  constructor(kind: boolean, public data: {
    currency: Ref,
    AO: Ref,
    Department: Ref,
    Customer: Ref,
    Product: Ref,
    Manager: Ref,
    Storehouse: Ref,
    Qty: number,
    Amount: number,
    Cost: number,
    Discount: number,
    Tax: number,
  }) {
    super(kind, data);
  }
}
