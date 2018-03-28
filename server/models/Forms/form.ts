import { PropOptions, symbolProps } from '../document';
import { FormTypes } from './form.types';

export interface FormOptions {
  type: FormTypes;
  description: string;
  icon: string;
  menu: string;
  commands?: { label: string, icon: string, command: () => any }[];
}

export function JForm(props: FormOptions) {
  return function classDecorator<T extends { new(...args: any[]): {} }>(constructor: T) {
    Reflect.defineMetadata(symbolProps, props, constructor);
    return class extends constructor {
      type = props.type;
    };
  };
}

export abstract class FormBase {

  private targetProp(target: Object, propertyKey: string): PropOptions {
    const result = Reflect.getMetadata(symbolProps, target, propertyKey);
    return result;
  }

  Prop(propertyKey: string = 'this'): PropOptions | FormOptions {
    if (propertyKey === 'this') {
      return Reflect.getMetadata(symbolProps, this.constructor);
    } else {
      return Reflect.getMetadata(symbolProps, this.constructor.prototype, propertyKey);
    }
  }

  Props() {
    const result: { [x: string]: any } = {};
    for (const prop of Object.keys(this)) {
      const Prop = Object.assign({}, this.targetProp(this, prop));
      if (!Prop) { continue; }
      for (const el in result[prop]) {
        if (typeof result[prop][el] === 'function') result[prop][el] = result[prop][el].toString();
      }
      result[prop] = Prop;
      const value = (this as any)[prop];
      if (value instanceof Array && value.length) {
        const arrayProp: { [x: string]: any } = {};
        for (const arrProp of Object.keys(value[0])) {
          const PropArr = Object.assign({}, this.targetProp(value[0], arrProp));
          if (!PropArr) { continue; }
          arrayProp[arrProp] = PropArr;
        }
        result[prop][prop] = arrayProp;
      }
    }
    return result;
  }
}
