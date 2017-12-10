import { Ref } from '../../document';
import { JRegisterAccumulation } from './RegisterAccumulation';
import { RegisterAccumulationTypes, IServerRegisterAccumulation } from './factory';

@JRegisterAccumulation({
  type: 'Register.Accumulation.Inventory',
  description: 'Товары на складах'
})
export class RegisterAccumulationInventory implements IServerRegisterAccumulation {
  type = 'Register.Accumulation.Inventory';
  date = new Date();
  company: Ref;
  document: Ref;
  constructor(public kind: boolean, public data: {
    Expense: Ref,
    Storehouse: Ref,
    SKU: Ref,
    Cost: number,
    Qty: number,
  }) { };
}
