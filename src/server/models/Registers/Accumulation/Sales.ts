import { Ref } from '../../document';
import { IServerRegisterAccumulation, RegisterAccumulationTypes } from './factory';
import { JRegister } from './RegisterAccumulation';

@JRegister({
  type: 'Register.Accumulation.Sales',
  description: 'Выручка и себестоимость продаж'
})
export class RegisterAccumulationSales implements IServerRegisterAccumulation {
  type: RegisterAccumulationTypes = 'Register.Accumulation.Sales';
  company: Ref;
  document: Ref;
  constructor(public kind: boolean, public data: {
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
    currency: Ref,
  }) { };
}
