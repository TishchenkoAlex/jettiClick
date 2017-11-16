import { IDocBase, Ref } from './doc.base';

export namespace PriceType {

  export interface IDoc extends IDocBase {
    doc: {
      currency: Ref,
      TaxInclude: boolean
    }
  }
}
