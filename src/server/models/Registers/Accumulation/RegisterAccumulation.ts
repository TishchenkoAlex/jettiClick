import { SQLGenegator } from '../../../fuctions/SQLGenerator';
import { PropOptions, Props, Ref, symbolProps } from './../../document';
import { RegisterAccumulationTypes } from './factory';

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
export abstract class RegisterAccumulation {
  @Props({ type: 'boolean' })
  kind: boolean = null;

  @Props({ type: 'string', hidden: true, hiddenInList: true })
  type: string = null;

  @Props({ type: 'Types.Document', hidden: true, hiddenInList: true })
  document: Ref = null;

  @Props({ type: 'Catalog.Company' })
  company: Ref = null;

  constructor(king: boolean) {
    this.kind = king;
  }

  private targetProp(target: Object, propertyKey: string): PropOptions {
    const result = Reflect.getMetadata(symbolProps, target, propertyKey);
    return result;
  }

  public Prop(propertyKey: string = 'this'): PropOptions | RegisterAccumulationOptions {
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

  get QueryList() { return SQLGenegator.QueryRegisterAccumulatioList(this.Props(), this.type) }
}

