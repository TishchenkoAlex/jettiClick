import { v1 } from 'uuid';
import 'reflect-metadata';

import { AllTypes, DocTypes } from './documents.types';

export interface PropOptions {
  type: AllTypes,
  label?: string,
  required?: boolean,
  readOnly?: boolean,
  hidden?: boolean,
  hiddenInList?: boolean,
  order?: number,
  controlType?: string,
  style?: { [x: string]: any },
  change?: string,
  owner?: string,
  totals?: number,
}

export interface DocumentOptions {
  type: DocTypes,
  description: string,
  icon: string,
  menu: string,
  chapter: string,
  dimensions?: { [x: string]: DocTypes }[],
  prifix: string
  generator?: string,
}

export type Ref = string | null;
export const symbolProps = Symbol('Props');

export function Props(props: PropOptions) {
  return Reflect.metadata(symbolProps, props);
}

export function JDocument(props: DocumentOptions) {
  return function classDecorator<T extends { new(...args: any[]): {} }>(constructor: T) {
    Reflect.defineMetadata(symbolProps, props, constructor);
    return class extends constructor {
      type = props.type;
    }
  }
}

export abstract class JDocumentBase {

  @Props({ type: 'string', hidden: true, hiddenInList: true })
  id: Ref = null;

  @Props({ type: 'string', hidden: true, hiddenInList: true })
  type = '';

  @Props({ type: 'datetime', order: 1 })
  date: Date;

  @Props({ type: 'string', order: 2, style: { width: '110px'} })
  code = '';

  @Props({ type: 'string', order: 3 })
  description = '';

  @Props({ type: 'Catalog.Company', order: 3, required: true, change: 'return call(doc, prop, value)' })
  company: Ref = null;

  @Props({ type: 'Catalog.User', hiddenInList: true, order: -1 })
  user: Ref = null;

  @Props({ type: 'boolean', hidden: true, hiddenInList: true })
  posted = false;

  @Props({ type: 'boolean', hidden: true, hiddenInList: true })
  deleted = false;

  @Props({ type: 'Types.Subcount', hidden: true, hiddenInList: true, order: -1 })
  parent: Ref = null;

  @Props({ type: 'boolean', hidden: true, hiddenInList: true })
  isfolder = false;

  @Props({ type: 'string', hiddenInList: true, order: -1 })
  info = '';

  constructor(date = new Date(), id = v1(), isfolder = false) {
    this.date = date;
    this.id = id;
    this.isfolder = isfolder;
  }

  targetProp(target: Object, propertyKey: string): PropOptions {
    const result = Reflect.getMetadata(symbolProps, target, propertyKey);
    return result || { type: 'string' };
  }

  Prop(propertyKey: string = 'this'): PropOptions | DocumentOptions {
    if (propertyKey === 'this') {
      return Reflect.getMetadata(symbolProps, this.constructor)
    } else {
      return Reflect.getMetadata(symbolProps, this.constructor.prototype, propertyKey) || { type: 'string' }
    }
  }

  Props() {
    const result: { [x: string]: any } = {};
    for (const prop of Object.keys(this)) {
      result[prop] = this.targetProp(this, prop);
      const value = (this as any)[prop];
      if (value instanceof Array && value.length) {
        const arrayProp: { [x: string]: any } = {};
        for (const arrProp of Object.keys(value[0])) {
          arrayProp[arrProp] = this.targetProp(value[0], arrProp);
        }
        result[prop][prop] = arrayProp;
      }
    }
    return result;
  }

  get isDoc() { return this.type.startsWith('Document.') }
  get isCatalog() { return this.type.startsWith('Catalog.') }
  get isType() { return this.type.startsWith('Types.') }
  get isJornal() { return this.type.startsWith('Journal.') }

}

export interface DBDocumentBase {
  id: Ref;
  date: string,
  type: string;
  code: string;
  description: string;
  company: Ref;
  user: Ref;
  posted: boolean;
  deleted: boolean;
  isfolder: boolean;
  parent: Ref;
  info: string;
  doc: { [x: string]: any }
}

