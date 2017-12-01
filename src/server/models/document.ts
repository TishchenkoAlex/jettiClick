import { v1 } from 'uuid';
import 'reflect-metadata';

import { AllTypes, DocTypes } from './documents.types';

export abstract class JDocumentBase {

  @Props({ type: 'string', hidden: true })
  id: Ref = null;

  @Props({ type: 'string', hidden: true })
  type = '';

  @Props({ type: 'datetime' })
  date: Date;

  @Props({ type: 'string' })
  code = '';

  @Props({ type: 'string' })
  description = '';

  @Props({ type: 'Catalog.Company' })
  company: Ref = null;

  @Props({ type: 'Catalog.User', hiddenInList: true })
  user: Ref = null;

  @Props({ type: 'boolean', hidden: true })
  posted = false;

  @Props({ type: 'boolean', hidden: true })
  deleted = false;

  @Props({ type: 'Types.Subcount', hidden: true })
  parent: Ref = null;

  @Props({ type: 'boolean', hidden: true })
  isfolder = false;

  @Props({ type: 'string' })
  info = '';

  constructor(date = new Date(), id = v1(), isfolder = false) {
    this.date = date;
    this.id = id;
    this.isfolder = isfolder;
  }

  targetProp(target: Object, propertyKey: string): PropOptions {
    return (Reflect.getMetadata(symbolProps, target, propertyKey) || { type: 'string' });
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

export type Ref = string | null;
