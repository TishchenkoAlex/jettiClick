import 'reflect-metadata';

import { v1 } from 'uuid';

import { SQLGenegator } from '../fuctions/SQLGenerator';
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

export abstract class DocumentBase {

  @Props({ type: 'string', hidden: true, hiddenInList: true })
  id: Ref = null;

  @Props({ type: 'string', hidden: true, hiddenInList: true })
  type = '';

  @Props({ type: 'datetime', order: 1 })
  date: Date;

  @Props({ type: 'string', order: 2, style: { width: '110px' } })
  code = '';

  @Props({ type: 'string', order: 3, style: { width: '300px' } })
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

  private targetProp(target: Object, propertyKey: string): PropOptions {
    const result = Reflect.getMetadata(symbolProps, target, propertyKey);
    return result;
  }

  private Prop(propertyKey: string = 'this'): PropOptions | DocumentOptions {
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
      const value = (this as any)[prop];
      if (value instanceof Array && value.length) {
        const arrayProp: { [x: string]: any } = {};
        for (const arrProp of Object.keys(value[0])) {
          const PropArr = this.targetProp(value[0], arrProp);
          if (!PropArr) { continue }
          arrayProp[arrProp] = PropArr;
        }
        result[prop][prop] = arrayProp;
      }
    }
    return result;
  }

  get QueryObject() { return SQLGenegator.QueryObject(this.Props(), this.type) }
  get QueryList() { return SQLGenegator.QueryList(this.Props(), this.type) }
  get QueryNew() { return SQLGenegator.QueryNew(this.Props(), this.type) }

  get isDoc() { return this.type.startsWith('Document.') }
  get isCatalog() { return this.type.startsWith('Catalog.') }
  get isType() { return this.type.startsWith('Types.') }
  get isJornal() { return this.type.startsWith('Journal.') }

}


