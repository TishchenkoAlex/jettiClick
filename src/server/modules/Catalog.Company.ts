import { Ref } from '../models/document';
import { IServerDocument } from './../models/ServerDocument';

export namespace Company {

  export interface IDoc extends IServerDocument {
    doc: {
      currency: Ref,
      prefix: string
    }
  }
}
