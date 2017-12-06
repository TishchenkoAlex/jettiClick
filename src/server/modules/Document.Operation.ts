import { lib } from '../std.lib';
import { Company } from './Catalog.Company';
import { FileldsAction, IDocBase, PatchValue, Post, RefValue, TX } from './doc.base';
import { Ref } from '../models/document';

export namespace Operation {

  export interface IDoc extends IDocBase {
    doc: {
      Operation: Ref,
      currency: Ref,
      Amount: number
    }
  }

  const company_valueChanges = async (doc: IDoc, value: RefValue): Promise<PatchValue> => {
    if (!value) { return {} }
    const company = await lib.doc.byId<Company.IDoc>(value.id);
    if (!company) { return {} }
    const currency = await lib.doc.formControlRef(company.doc.currency) as RefValue;
    return { currency: currency || {} };
  }

  export const Actions: FileldsAction = {
    'company': company_valueChanges
  }

  export const post: Post = async (doc: IDoc, Registers: { Account: any[], Accumulation: any[], Info: any[] }, tx: TX) => {

    const query = `SELECT (doc->>'script') script FROM "Documents" WHERE id = $1`;
    const operation = await tx.oneOrNone(query, [doc.doc.Operation]);
    if (operation && operation.script) {
      let script = operation.script.replace(/\$\./g, 'doc.doc.');
      script = script.replace(/\lib\./g, 'await lib.');
      const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;
      const func = new AsyncFunction('doc, Registers, tx, lib', script);
      await func(doc, Registers, tx, lib);
    }
  }

}
