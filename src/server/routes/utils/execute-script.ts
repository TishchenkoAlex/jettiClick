import { IDatabase, ITask } from 'pg-promise';

import { createServerDocument } from '../../models/documents.factory.server';
import { DocTypes } from '../../models/documents.types';
import { PostResult } from '../../models/post.interfaces';
import { JDM } from './../../modules';
import { lib } from './../../std.lib';
import { IServerDocument } from './../../models/ServerDocument';

export async function ExecuteScript(doc: IServerDocument, script, tx: ITask<any>) {
  if (!script) { return doc };
  const Registers: PostResult = { Account: [], Accumulation: [], Info: [] };
  if (script === 'post') {
    const JDoc = createServerDocument(doc.type as DocTypes, doc);
    if (JDoc) { await JDoc.onPost(Registers, tx)
    } else { if (JDM[doc.type] && JDM[doc.type].post) { await JDM[doc.type].post(doc, Registers, tx) }};
  } else {
    const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;
    const func = new AsyncFunction('doc, Registers, tx, lib', script);
    await func(doc, Registers, tx, lib);
  }

  let query = '';
  for (const rec of Registers.Account) {
    query += `
        INSERT INTO "Register.Account" (
          datetime, document, operation, sum, company,
          dt, dt_subcount1, dt_subcount2, dt_subcount3, dt_subcount4, dt_qty, dt_cur,
          kt, kt_subcount1, kt_subcount2, kt_subcount3, kt_subcount4, kt_qty, kt_cur )
        VALUES (
          '${new Date(doc.date).toJSON()}',
          '${doc.id}', '${rec.operation || doc.doc.Operation || doc.type}', ${rec.sum || 0}, '${rec.company || doc.company}',
          '${rec.debit.account}',
          '${rec.debit.subcounts[0]}', '${rec.debit.subcounts[1]}',
          '${rec.debit.subcounts[2]}', '${rec.debit.subcounts[3]}',
          ${rec.debit.qty || 0}, '${rec.debit.currency || doc.doc.currency}',
          '${rec.kredit.account}',
          '${rec.kredit.subcounts[0]}', '${rec.kredit.subcounts[1]}',
          '${rec.kredit.subcounts[2]}', '${rec.kredit.subcounts[3]}',
          ${rec.kredit.qty || 0}, '${rec.kredit.currency || doc.doc.currency}'
        );`;
  };

  for (const rec of Registers.Accumulation) {
    const data = JSON.stringify(rec.data);
    query += `
        INSERT INTO "Register.Accumulation" (kind, type, date, document, company, data)
        VALUES (${rec.kind}, '${rec.type}', '${new Date(doc.date).toJSON()}', '${doc.id}', '${rec.company || doc.company}', '${data}');`;
  };

  for (const rec of Registers.Info) {
    const data = JSON.stringify(rec.data);
    query += `
        INSERT INTO "Register.Info" (type, date, document, company, data)
        VALUES ('${rec.type}', '${new Date(doc.date).toJSON()}', '${doc.id}', '${rec.company || doc.company}', '${data}');`;
  };

  if (query) { await tx.none(query) };
  return doc;
}

export async function docOperationResolver(doc: IServerDocument, tx: ITask<any> | IDatabase<any>) {
  if (doc.type !== 'Document.Operation') { return }; // only for Operations docs
  for (let i = 1; i <= 10; i++) {
    const p = doc['p' + i.toString()];
    if (p instanceof Array) {
      for (const el of p) {
        for (const key in el) {
          if (typeof el[key] === 'string') {
            const data = await lib.doc.formControlRef(el[key], tx); // todo check types in model
            if (data) { el[key] = data; }
          }
        }
      }
    }
  }
}

export async function doSubscriptions(doc: IServerDocument, script: string, tx: ITask<any>) {
  const scripts = await tx.manyOrNone(`
    SELECT "then" FROM "Subscriptions" WHERE "what" ? $1 AND "when" = $2 ORDER BY "order"`, [doc.type, script]);
  if (scripts.length) {
    const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;
    for (const scr of scripts) {
      if (scr) {
        const func = new AsyncFunction('doc, db', scr.then);
        await func(doc, tx);
      }
    };
  }
}
