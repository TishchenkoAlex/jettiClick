import { IDocBase } from './doc.base';
import { Ref } from '../models/document';

export namespace PriceType {

  export interface IDoc extends IDocBase {
    doc: {
      currency: Ref,
      TaxInclude: boolean
    }
  }
}
