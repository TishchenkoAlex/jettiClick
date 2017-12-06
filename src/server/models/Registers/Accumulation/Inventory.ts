import { Ref } from '../../document';
import { JRegister } from './RegisterAccumulation';
import { RegisterAccumulationTypes, IServerRegisterAccumulation } from './factory';

@JRegister({
  type: 'Register.Accumulation.Inventory',
  description: 'Товары на складах'
})
export class RegisterAccumulationInventory implements IServerRegisterAccumulation {
  type: RegisterAccumulationTypes = 'Register.Accumulation.Inventory';
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
