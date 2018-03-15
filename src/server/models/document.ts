import { v1 } from 'uuid';

import { INoSqlDocument } from './../models/ServerDocument';
import { AllTypes, DocTypes, PrimitiveTypes } from './documents.types';
import { ICommand } from './commands';
import { RefValue } from '../models/api';

export interface OwnerRef { dependsOn: string; filterBy: string; }

export interface PropOptions {
  type: AllTypes;
  label?: string;
  required?: boolean;
  readOnly?: boolean;
  hidden?: boolean;
  hiddenInList?: boolean;
  hiddenInForm?: boolean;
  order?: number;
  controlType?: PrimitiveTypes;
  style?: { [x: string]: any };
  owner?: OwnerRef;
  totals?: number;
  change?: boolean;
  onChange?: Function;
  onChangeServer?: boolean;
  value?: any;
}

export interface DocumentOptions {
  type: DocTypes;
  description: string;
  icon: string;
  menu: string;
  dimensions?: { [x: string]: AllTypes }[];
  prefix: string;
  commands?: ICommand[];
  presentation?: 'code' | 'description';
  copyTo?: DocTypes[];
  relations?: [{ name: string, type: DocTypes, field: string }];
}

export type Ref = string | null | RefValue;
export const symbolProps = Symbol('Props');

export function Props(props: PropOptions) {
  return Reflect.metadata(symbolProps, props);
}

export function JDocument(props: DocumentOptions) {
  return function classDecorator<T extends { new(...args: any[]): {} }>(constructor: T) {
    Reflect.defineMetadata(symbolProps, props, constructor);
    return class extends constructor {
      type = props.type;
    };
  };
}

export class DocumentBase {

  @Props({ type: 'string', hidden: true, hiddenInList: true })
  id = v1();

  @Props({ type: 'string', hidden: true, hiddenInList: true })
  type: DocTypes = null;

  @Props({ type: 'datetime', order: 1 })
  date = new Date();

  @Props({ type: 'string', order: 2, style: { width: '135px' } })
  code = '';

  @Props({ type: 'string', order: 3, required: true, style: { width: '300px' } })
  description = '';

  @Props({ type: 'Catalog.Company', order: 3, required: true, onChangeServer: true })
  company = null;

  @Props({ type: 'Catalog.User', hiddenInList: true, order: -1 })
  user = null;

  @Props({ type: 'boolean', hidden: true, hiddenInList: true })
  posted = false;

  @Props({ type: 'boolean', hidden: true, hiddenInList: true })
  deleted = false;

  @Props({ type: 'Types.Subcount', hidden: true, hiddenInList: true, order: -1 })
  parent = null;

  @Props({ type: 'boolean', hidden: true, hiddenInList: true })
  isfolder = false;

  @Props({ type: 'string', hiddenInList: true, order: -1, controlType: 'textarea' })
  info = '';

  @Props({ type: 'datetime', hiddenInList: true, order: -1, hidden: true })
  timestamp: Date = null;

  private targetProp(target: Object, propertyKey: string): PropOptions {
    const result = Reflect.getMetadata(symbolProps, target, propertyKey);
    return result;
  }

  Prop(propertyKey: string = 'this'): PropOptions | DocumentOptions {
    if (propertyKey === 'this') {
      return Reflect.getMetadata(symbolProps, this.constructor);
    } else {
      return Reflect.getMetadata(symbolProps, this.constructor.prototype, propertyKey);
    }
  }

  get isDoc() { return this.type.startsWith('Document.'); }
  get isCatalog() { return this.type.startsWith('Catalog.'); }
  get isType() { return this.type.startsWith('Types.'); }
  get isJornal() { return this.type.startsWith('Journal.'); }

  Props() {
    this.targetProp(this, 'description').hidden = this.isDoc;
    this.targetProp(this, 'date').hidden = this.isCatalog;
    this.targetProp(this, 'company').hidden = this.isCatalog;

    const result: { [x: string]: PropOptions } = {};
    for (const prop of Object.keys(this)) {
      const Prop = this.targetProp(this, prop);
      if (!Prop) { continue; }
      for (const el in Prop) {
        if (typeof Prop[el] === 'function') { Prop[el] = Prop[el].toString(); }
      }
      result[prop] = {...Prop};
      const value = (this as any)[prop];
      if (value instanceof Array && value.length) {
        const arrayProp: { [x: string]: any } = {};
        for (const arrProp of Object.keys(value[0])) {
          const PropArr = this.targetProp(value[0], arrProp);
          if (!PropArr) { continue; }
          for (const el in PropArr) {
            if (typeof PropArr[el] === 'function') { PropArr[el] = PropArr[el].toString(); }
          }
          arrayProp[arrProp] = {...PropArr};
        }
        result[prop][prop] = arrayProp;
      }
    }
    return result;
  }

  map(document: INoSqlDocument) {
    if (document) {
      const { doc, ...header } = document;
      Object.assign(this, header, doc);
    }
  }
}
