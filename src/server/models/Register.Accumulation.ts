import 'reflect-metadata';

import { Ref, symbolProps, Props, PropOptions } from './document';

export type RegisterAccumulationTypes =
  'Register.Accumulation.Balance' |
  'Register.Accumulation.AR' |
  'Register.Accumulation.Inventory' |
  'Register.Accumulation.Sales';

export interface RegisterAccumulationOptions {
  type: RegisterAccumulationTypes,
  description: string
}

export function JRegister(props: RegisterAccumulationOptions) {
  return function classDecorator<T extends { new(...args: any[]): {} }>(constructor: T) {
    Reflect.defineMetadata(symbolProps, props, constructor);
    return class extends constructor {
      type = props.type;
    }
  }
}

export interface IServerRegisterAccumulation {
  kind: boolean,
  type: string,
  document: Ref,
  company: Ref,
  data: { [x: string]: any }
}

export abstract class RegisterAccumulation {
  @Props({ type: 'boolean'})
  kind: boolean = null;

  @Props({ type: 'string', hidden: true, hiddenInList: true })
  type: string;

  @Props({ type: 'Types.Document', hidden: true, hiddenInList: true })
  document: Ref = null;

  @Props({ type: 'Catalog.Company' })
  company: Ref = null;

  constructor (king: boolean) {
    this.kind = king;
  }

  private targetProp(target: Object, propertyKey: string): PropOptions {
    const result = Reflect.getMetadata(symbolProps, target, propertyKey);
    return result;
  }

  private Prop(propertyKey: string = 'this'): PropOptions | RegisterAccumulationOptions {
    if (propertyKey === 'this') {
      return Reflect.getMetadata(symbolProps, this.constructor)
    } else {
      return Reflect.getMetadata(symbolProps, this.constructor.prototype, propertyKey);
    }
  }

  Props() {
    const result: { [x: string]: any } = {};
    for (const prop of Object.keys(this)) {
      const Prop = this.targetProp(this, prop);
      if (!Prop) { continue }
      result[prop] = Prop;
    }
    return result;
  }
}

@JRegister({
  type: 'Register.Accumulation.Balance',
  description: 'Активы/Пассивы'
})
export class RegisterAccumulationBalance extends RegisterAccumulation {

  @Props({ type: 'Catalog.Department' })
  Department: Ref = null;

  @Props({ type: 'Catalog.Balance' })
  Balance: Ref= null;

  @Props({ type: 'Catalog.Balance.Analytics' })
  Analytics: Ref = null;

  @Props({ type: 'number' })
  Amount: number = null;

  constructor(kind: boolean, public data: {
    Department: Ref,
    Balance: Ref,
    Analytics: Ref,
    Amount: number,
  }) {
    super(kind);
    this.Department = data.Department;
    this.Balance = data.Balance;
    this.Analytics = data.Analytics;
    this.Amount = data.Amount;
  }
}

@JRegister({
  type: 'Register.Accumulation.AR',
  description: 'Расчеты с клиентами'
})
export class RegisterAccumulationAR implements IServerRegisterAccumulation {
  type: RegisterAccumulationTypes = 'Register.Accumulation.AR';
  company: Ref;
  document: Ref;
  constructor(public kind: boolean = null, public data: {
    AO: Ref,
    Department: Ref,
    Customer: Ref,
    AR: number,
    PayDay: string,
    currency: Ref,
  }) { }
}

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

export type RegistersAccumulations =
  RegisterAccumulationBalance |
  RegisterAccumulationAR |
  RegisterAccumulationInventory |
  RegisterAccumulationSales;
