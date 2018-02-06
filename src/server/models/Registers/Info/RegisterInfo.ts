import { SQLGenegator } from '../../../fuctions/SQLGenerator';
import { PropOptions, Props, Ref, symbolProps } from './../../document';
import { RegisterInfoTypes } from './factory';

export interface RegisterInfoOptions {
  type: RegisterInfoTypes;
  description: string;
}

export function JRegisterInfo(props: RegisterInfoOptions) {
  return function classDecorator<T extends { new(...args: any[]): {} }>(constructor: T) {
    Reflect.defineMetadata(symbolProps, props, constructor);
    return class extends constructor {
      type = props.type;
    };
  };
}
export class RegisterInfo {

  @Props({ type: 'string', hidden: true, hiddenInList: true })
  type: string = null;

  @Props({ type: 'datetime' })
  date: Date = new Date();

  @Props({ type: 'Catalog.Company' })
  company: Ref = null;

  @Props({ type: 'Types.Document', hiddenInList: true })
  document: Ref = null;

  constructor(public data: { [x: string]: any }) {
    Object.keys(data).forEach(k => this[k] = data[k]);
  }

  private targetProp(target: Object, propertyKey: string): PropOptions {
    const result = Reflect.getMetadata(symbolProps, target, propertyKey);
    return result;
  }

  public Prop(propertyKey: string = 'this'): PropOptions | RegisterInfoOptions {
    if (propertyKey === 'this') {
      return Reflect.getMetadata(symbolProps, this.constructor);
    } else {
      return Reflect.getMetadata(symbolProps, this.constructor.prototype, propertyKey);
    }
  }

  Props() {
    const result: { [x: string]: any } = {};
    for (const prop of Object.keys(this)) {
      const Prop = this.targetProp(this, prop);
      if (!Prop) { continue; }
      result[prop] = Prop;
    }
    return result;
  }

  QueryList() { return SQLGenegator.QueryRegisterInfoList(this.Props(), this.type); }
}
