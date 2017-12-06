import { IDocBase } from './doc.base';
import { Ref } from '../models/document';

export namespace Company {

  export interface IDoc extends IDocBase {
    doc: {
      currency: Ref,
      prefix: string
    }
  }
}
