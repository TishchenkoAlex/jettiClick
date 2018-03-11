import { createDocument, IRegisteredDocument } from './../models/documents.factory';
import { CatalogOperationServer } from './Catalogs/Catalog.Operation.server';
import { DocumentBase, DocumentOptions } from './document';
import { DocTypes } from './documents.types';
import { DocumentExchangeRatesServer } from './Documents/Document.ExchangeRates.server';
import { DocumentInvoiceServer } from './Documents/Document.Invoce.server';
import { DocumentOperationServer } from './Documents/Document.Operation.server';
import { DocumentPriceListServer } from './Documents/Document.PriceList.server';
import { DocumentBaseServer, INoSqlDocument } from './ServerDocument';
import { SQLGenegator } from '../fuctions/SQLGenerator.MSSQL';
import { sdb } from '../mssql';

const RegisteredServerDocument: IRegisteredDocument<any>[] = [
  { type: 'Document.Invoice', Class: DocumentInvoiceServer },
  { type: 'Document.ExchangeRates', Class: DocumentExchangeRatesServer },
  { type: 'Document.PriceList', Class: DocumentPriceListServer },
  { type: 'Document.Operation', Class: DocumentOperationServer },
  { type: 'Catalog.Operation', Class: CatalogOperationServer },
];

export async function createDocumentServer<T extends DocumentBaseServer | DocumentBase>(type: DocTypes, document?: INoSqlDocument) {
  let result: T;
  const doc = RegisteredServerDocument.find(el => el.type === type);
  if (doc) {
    const serverResult = <T>new doc.Class;
    serverResult.map(document);
    result = serverResult;
  } else {
    result = createDocument<T>(type, document);
  }
  if (type === 'Document.Operation') {
    const Props = result.Props();
    const Parameters = await sdb.oneOrNone<{ Parameters: any[] }>(`
    select JSON_QUERY(doc, '$.Parameters') "Parameters" from "Documents"
    where id = (select JSON_VALUE(doc, '$.Operation') from "Documents" where id = @p1)`, [result.id]);
    (Parameters.Parameters || []).sort((a, b) => a.order - b.order).forEach(c => Props[c.parameter] = {
      label: c.label, type: c.type, required: !!c.required, change: c.change, order: c.order + 103,
      [c.parameter]: c.tableDef ? JSON.parse(c.tableDef) : null
    });
    const QueryObject = SQLGenegator.QueryObject(Props, result.Prop() as DocumentOptions);
    result.Props = () => Props;
    result['QueryObject'] = QueryObject;
  }
  return result;
}

// const catalogAccount = createDocumentServer<CatalogAccount>('Catalog.Account');
