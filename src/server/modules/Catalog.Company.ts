import { IDocBase, Ref } from './doc.base';

export namespace Company {

  export interface IDoc extends IDocBase {
    doc: {
      currency: Ref,
      prefix: string
    }
  }
}
