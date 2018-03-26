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
import { DocumentBaseServer, IFlatDocument } from './ServerDocument';

const RegisteredServerDocument: IRegisteredDocument<any>[] = [
  { type: 'Document.Invoice', Class: DocumentInvoiceServer },
  { type: 'Document.ExchangeRates', Class: DocumentExchangeRatesServer },
  { type: 'Document.PriceList', Class: DocumentPriceListServer },
  { type: 'Document.Operation', Class: DocumentOperationServer },
  { type: 'Catalog.Operation', Class: CatalogOperationServer },
];

export async function createDocumentServer<T extends DocumentBaseServer | DocumentBase>
  (type: DocTypes, document?: IFlatDocument, tx = sdb) {
  let result: T;
  const doc = RegisteredServerDocument.find(el => el.type === type);
  if (doc) {
    const serverResult = <T>new doc.Class;
    serverResult.map(document);
    result = serverResult;
  } else {
    result = createDocument<T>(type, document);
  }
  const Props = Object.assign({}, result.Props());
  const Prop = Object.assign({}, result.Prop() as DocumentOptions);
  if (result instanceof DocumentOperation && document && document.id) {
    if (result.Operation) {
      const Operation = await lib.doc.byId(result.Operation as string);
      result.Group = Operation['Group'];
      (Operation && Operation['Parameters'] || []).sort((a, b) => a.order - b.order).forEach(c => {
        Props[c.parameter] = ({
          label: c.label, type: c.type, required: !!c.required, change: c.change, order: c.order + 103,
          [c.parameter]: c.tableDef ? JSON.parse(c.tableDef) : null, ...JSON.parse(c.Props ? c.Props : '{}')
        });
      });
      result['QueryNew'] = () => SQLGenegator.QueryNew(Props, Prop);
      result['QueryObject'] = () => SQLGenegator.QueryObject(Props, Prop);
    }
  }
  const sc = configSchema.get(type);
  if (!result['QueryList']) result['QueryList'] = () => sc.QueryList;
  if (!result['QueryObject']) result['QueryObject'] = () => sc.QueryObject;
  if (!result['QueryNew']) result['QueryNew'] = () => sc.QueryNew;
  // protect against mutate
  result.Props = () => Props;
  result.Prop = () => Prop;
  // Clear all document's table-parts
  if (!document) Object.keys(result).filter(k => result[k] instanceof Array).forEach(a => result[a].length = 0);
  return result;
}
