import { SQLGenegator } from '../fuctions/SQLGenerator.MSSQL';
import { sdb } from '../mssql';
import { lib } from '../std.lib';
import { createDocument, IRegisteredDocument } from './../models/documents.factory';
import { CatalogOperationServer } from './Catalogs/Catalog.Operation.server';
import { configSchema } from './config';
import { DocumentBase, DocumentOptions } from './document';
import { DocTypes } from './documents.types';
import { DocumentExchangeRatesServer } from './Documents/Document.ExchangeRates.server';
import { DocumentInvoiceServer } from './Documents/Document.Invoce.server';
import { DocumentOperation } from './Documents/Document.Operation';
import { DocumentOperationServer } from './Documents/Document.Operation.server';
import { DocumentPriceListServer } from './Documents/Document.PriceList.server';
import { DocumentBaseServer, INoSqlDocument } from './ServerDocument';

const RegisteredServerDocument: IRegisteredDocument<any>[] = [
  { type: 'Document.Invoice', Class: DocumentInvoiceServer },
  { type: 'Document.ExchangeRates', Class: DocumentExchangeRatesServer },
  { type: 'Document.PriceList', Class: DocumentPriceListServer },
  { type: 'Document.Operation', Class: DocumentOperationServer },
  { type: 'Catalog.Operation', Class: CatalogOperationServer },
];

export async function createDocumentServer<T extends DocumentBaseServer | DocumentBase>
  (type: DocTypes, document?: INoSqlDocument, tx = sdb, readFromDB = false) {
  let result: T;
  const doc = RegisteredServerDocument.find(el => el.type === type);
  if (doc) {
    const serverResult = <T>new doc.Class;
    serverResult.map(document);
    result = serverResult;
  } else {
    result = createDocument<T>(type, document);
  }
  const Props = result.Props();
  const Prop =  result.Prop() as DocumentOptions;
  const Operation = result['Operation'] && typeof result['Operation'] === 'object' ? result['Operation'].id : result['Operation'];
  if (result instanceof DocumentOperation && document && document.id) {
    let Parameters = { Parameters: []};
    if (Operation) {
      Parameters = await tx.oneOrNone<{ Parameters: any[] }>(`
      SELECT JSON_QUERY(doc, '$.Parameters') "Parameters" FROM "Documents"
      WHERE id = '${Operation}'`);
    } else {
      Parameters = await tx.oneOrNone<{ Parameters: any[] }>(`
      SELECT JSON_QUERY(doc, '$.Parameters') "Parameters" FROM "Documents"
      WHERE id = (SELECT JSON_VALUE(doc, '$.Operation') FROM "Documents" WHERE id = '${result.id}')`);
    }
    (Parameters && Parameters.Parameters || []).sort((a, b) => a.order - b.order).forEach(c => {
      Props[c.parameter] = ({
        label: c.label, type: c.type, required: !!c.required, change: c.change, order: c.order + 103,
        [c.parameter]: c.tableDef ? JSON.parse(c.tableDef) : null, ...JSON.parse(c.Props ? c.Props : '{}')
      });
    });
    result.Props = () => Props;
    result['QueryNew'] = () => SQLGenegator.QueryNew(Props, Prop);
    result['QueryObject'] = () => SQLGenegator.QueryObject(Props, Prop);
  }
  const sc = configSchema.get(type);
  if (!result['QueryList']) result['QueryList'] = () => sc.QueryList;
  if (!result['QueryObject']) result['QueryObject'] = () => sc.QueryObject;
  if (!result['QueryNew']) result['QueryNew'] = () => sc.QueryNew;
  if (readFromDB && document.id) {
    let serverDoc = await tx.oneOrNone<T>(`${result['QueryObject']()} AND d.id = '${result.id}'`);
    if (!serverDoc) serverDoc = await tx.oneOrNone<T>(`${result['QueryNew']()}`);
    result.map(serverDoc as any);
    result.id = document.id as string;
  }
  if (result instanceof DocumentOperation && Operation && readFromDB) {
    result.Operation = await lib.doc.formControlRef(Operation as string, tx);
  }

  return result;
}
