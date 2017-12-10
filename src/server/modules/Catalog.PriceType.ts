import { Ref } from '../models/document';
import { IServerDocument } from './../models/ServerDocument';

export namespace PriceType {

  export interface IDoc extends IServerDocument {
    doc: {
      currency: Ref,
      TaxInclude: boolean
    }
  }
}
