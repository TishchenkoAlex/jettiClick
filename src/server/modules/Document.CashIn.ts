import { lib } from '../std.lib';
import { Company } from './Catalog.Company';
import { FileldsAction, RefValue } from './doc.base';
import { Ref } from '../models/document';
import { IServerDocument } from './../models/ServerDocument';

export namespace CashIn {

  export interface IDoc extends IServerDocument {
    doc: {
      currency: Ref,
      Amount: number
    }
  }

  const company_valueChanges = async (doc: IServerDocument, value: RefValue) => {
    if (!value) { return {} }
    const company = await lib.doc.byId<Company.IDoc>(value.id);
    if (!company) { return {} }
    const currency = await lib.doc.formControlRef(company.doc.currency) as RefValue;
    return { currency: currency || {} };
  }

  export const Actions: FileldsAction = {
    'company': company_valueChanges
  }

  const createFrom = async (source: IDoc): Promise<IDoc> => {
    const s = lib.doc.byId<IDoc>(source.id);
    return s;
  }

}
