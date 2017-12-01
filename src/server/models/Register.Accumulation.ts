import { Ref } from './document';

export interface IRegisterAccumulation {
  kind: boolean,
  type: string,
  data: { [x: string]: any }
}

export class RegisterAccumulationBalance implements IRegisterAccumulation {
  type: 'Register.Accumulation.Balance';
  constructor(public kind: boolean, public data: {
    Department: Ref,
    Balance: Ref,
    Analytics: Ref,
    Amount: number,
    company?: Ref
  }) { }
}

export class RegisterAccumulationAR implements IRegisterAccumulation {
  type: 'Register.Accumulation.AR';
  constructor(public kind: boolean, public data: {
    AO: Ref,
    Department: Ref,
    Customer: Ref,
    AR: number,
    PayDay: string,
    currency: Ref
  }) { }
}

export class RegisterAccumulationInventory implements IRegisterAccumulation {
  type: 'Register.Accumulation.Inventory';
  constructor(public kind: boolean, public data: {
    Expense: Ref;
    Storehouse: Ref;
    SKU: Ref;
    Cost: number;
    Qty: number;
  }) { };
}

export class RegisterAccumulationSales implements IRegisterAccumulation {
  type: 'Register.Accumulation.Sales';
  constructor(public kind: boolean, public data: {
    AO: Ref;
    Department: Ref;
    Customer: Ref;
    Product: Ref;
    Manager: Ref;
    Storehouse: Ref;
    Qty: number;
    Amount: number;
    Cost: number;
    Discount: 0;
    Tax: number;
    currency: Ref;
  }) { };
}


export type RegistersAccumulations =
  RegisterAccumulationBalance |
  RegisterAccumulationAR |
  RegisterAccumulationInventory |
  RegisterAccumulationSales;
